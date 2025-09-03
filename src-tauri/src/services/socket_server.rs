use serde::{Deserialize, Serialize};
use socketioxide::{
    extract::{Data, SocketRef},
    SocketIo,
};
use std::sync::Arc;
use tokio::{net::TcpListener, sync::Mutex};
use tracing::{error, info, warn};
use uuid::Uuid;
use axum::Router;
use tower_http::cors::CorsLayer;

use crate::services::player_manager::{PlayerManager, PlayerInfo};
use crate::services::tournament_service::TournamentState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerStatus {
    pub running: bool,
    pub port: u16,
    pub player_count: usize,
    pub server_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerJoinRequest {
    #[serde(rename = "playerName")]
    pub player_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerActionRequest {
    pub action: String,
    pub selection: String,
    pub timestamp: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActionResponse {
    pub success: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidatedPlayerAction {
    pub player: String,        // "P1" | "P2"
    pub action: String,        // "BAN" | "PICK" | "DECIDER"
    pub selection: String,     // Asset name
    pub timestamp: u64,
    pub socket_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimerControlEvent {
    pub action: String,        // "PAUSE" | "RESUME" | "STOP" | "EXTEND"
    #[serde(rename = "timeRemaining")]
    pub time_remaining: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TournamentResults {
    pub winner: Option<String>,       // "P1" | "P2"
    #[serde(rename = "finalMap")]
    pub final_map: String,
    #[serde(rename = "finalAgents")]
    pub final_agents: std::collections::HashMap<String, String>, // P1/P2 -> agent
    pub duration: u64,                // Tournament duration in seconds
    pub summary: String,
}

pub struct TournamentServer {
    io: Option<SocketIo>,
    status: Arc<Mutex<ServerStatus>>,
    player_manager: Arc<Mutex<PlayerManager>>,
    server_handle: Option<tokio::task::JoinHandle<()>>,
}

impl TournamentServer {
    pub fn new() -> Self {
        let server_id = Uuid::new_v4().to_string();
        let status = ServerStatus {
            running: false,
            port: 0,
            player_count: 0,
            server_id,
        };

        Self {
            io: None,
            status: Arc::new(Mutex::new(status)),
            player_manager: Arc::new(Mutex::new(PlayerManager::new())),
            server_handle: None,
        }
    }

    pub async fn start(&mut self, port: u16) -> Result<String, String> {
        // Check if server is already running
        {
            let status = self.status.lock().await;
            if status.running {
                return Err("Server is already running".to_string());
            }
        }

        info!("Starting tournament server on port {}", port);

        // Create Socket.IO server with CORS configuration
        let (layer, io) = SocketIo::new_layer();
        
        // Configure CORS for local development
        let cors = CorsLayer::new()
            .allow_origin(tower_http::cors::Any)
            .allow_methods(tower_http::cors::Any)
            .allow_headers(tower_http::cors::Any);

        let app = Router::new()
            .layer(cors)
            .layer(layer);

        // Clone references for the async task
        let status_clone = Arc::clone(&self.status);
        let player_manager_clone = Arc::clone(&self.player_manager);

        // Setup Socket.IO event handlers
        self.setup_socket_handlers(&io, player_manager_clone.clone());

        // Bind to the specified port
        let listener = TcpListener::bind(format!("127.0.0.1:{}", port))
            .await
            .map_err(|e| format!("Failed to bind to port {}: {}", port, e))?;

        // Update server status
        {
            let mut status = status_clone.lock().await;
            status.running = true;
            status.port = port;
            status.player_count = 0;
        }

        // Start the server in a background task
        let handle = tokio::spawn(async move {
            if let Err(e) = axum::serve(listener, app).await {
                error!("Server error: {}", e);
                // Update status on error
                let mut status = status_clone.lock().await;
                status.running = false;
            }
        });

        self.server_handle = Some(handle);
        self.io = Some(io);

        info!("Tournament server started successfully on port {}", port);
        Ok(format!("Server started on port {}", port))
    }

    pub async fn stop(&mut self) -> Result<String, String> {
        info!("Stopping tournament server");

        // Update status first
        {
            let mut status = self.status.lock().await;
            status.running = false;
            status.player_count = 0;
        }

        // Disconnect all players
        {
            let mut player_manager = self.player_manager.lock().await;
            player_manager.disconnect_all_players();
        }

        // Abort the server task if it exists
        if let Some(handle) = self.server_handle.take() {
            handle.abort();
        }

        self.io = None;

        info!("Tournament server stopped successfully");
        Ok("Server stopped".to_string())
    }

    pub async fn get_status(&self) -> ServerStatus {
        let status = self.status.lock().await;
        let player_manager = self.player_manager.lock().await;
        
        ServerStatus {
            running: status.running,
            port: status.port,
            player_count: player_manager.get_connected_count(),
            server_id: status.server_id.clone(),
        }
    }

    pub async fn get_connected_players(&self) -> Vec<PlayerInfo> {
        let player_manager = self.player_manager.lock().await;
        player_manager.get_all_players()
    }

    pub async fn broadcast_tournament_state(&self, state: TournamentState) -> Result<(), String> {
        if let Some(ref io) = self.io {
            // Transform admin state to player-compatible format
            let player_state = crate::services::tournament_service::transform_for_players(&state);
            
            // Broadcast to all connected players
            io.emit("game-state-update", &player_state).ok();
            info!("Broadcasted tournament state to all players");
            Ok(())
        } else {
            Err("Server is not running".to_string())
        }
    }

    pub async fn send_turn_start(&self, tournament_state: &TournamentState, target_player: &str, time_limit: i32) -> Result<(), String> {
        if let Some(ref io) = self.io {
            let player_manager = self.player_manager.lock().await;
            
            if let Some(socket_id) = player_manager.get_socket_for_player(target_player) {
                // Calculate available options for this turn
                let available_options = crate::services::tournament_service::get_available_options(tournament_state);
                
                // Create turn start event
                let turn_event = crate::services::tournament_service::create_turn_start_event(
                    tournament_state,
                    target_player,
                    available_options,
                    time_limit,
                );
                
                // Send to specific player
                io.to(socket_id.clone()).emit("turn-start", &turn_event).ok();
                info!("Sent turn start event to player {} (socket: {})", target_player, socket_id);
                Ok(())
            } else {
                Err(format!("Player {} not connected", target_player))
            }
        } else {
            Err("Server is not running".to_string())
        }
    }

    pub async fn send_timer_control(&self, control: TimerControlEvent) -> Result<(), String> {
        if let Some(ref io) = self.io {
            io.emit("timer-control", &control).ok();
            info!("Sent timer control event: {:?}", control);
            Ok(())
        } else {
            Err("Server is not running".to_string())
        }
    }

    pub async fn send_tournament_start(&self, tournament_state: &TournamentState) -> Result<(), String> {
        if let Some(ref io) = self.io {
            let player_state = crate::services::tournament_service::transform_for_players(tournament_state);
            io.emit("tournament-start", &player_state).ok();
            info!("Sent tournament start event to all players");
            Ok(())
        } else {
            Err("Server is not running".to_string())
        }
    }

    pub async fn send_tournament_end(&self, results: &TournamentResults) -> Result<(), String> {
        if let Some(ref io) = self.io {
            io.emit("tournament-end", results).ok();
            info!("Sent tournament end event to all players");
            Ok(())
        } else {
            Err("Server is not running".to_string())
        }
    }

    fn setup_socket_handlers(&self, io: &SocketIo, player_manager: Arc<Mutex<PlayerManager>>) {
        let player_manager_clone = Arc::clone(&player_manager);
        let status_clone = Arc::clone(&self.status);

        // Handle new connections
        io.ns("/", move |socket: SocketRef| {
            let player_manager = Arc::clone(&player_manager_clone);
            let status = Arc::clone(&status_clone);

            info!("New client connected: {}", socket.id);

            // Handle player join
            socket.on("player-join", {
                let player_manager = Arc::clone(&player_manager);
                let status = Arc::clone(&status);
                move |socket: SocketRef, Data::<PlayerJoinRequest>(data)| {
                    let pm_clone = Arc::clone(&player_manager);
                    let status_clone = Arc::clone(&status);
                    let socket = socket.clone();
                    tokio::spawn(async move {
                        let mut pm = pm_clone.lock().await;
                
                        match pm.add_player(&data.player_name, &socket.id.to_string()) {
                            Ok(player_info) => {
                                // Update player count in status
                                {
                                    let mut s = status_clone.lock().await;
                                    s.player_count = pm.get_connected_count();
                                }

                                // Send assignment to player
                                let assignment = serde_json::json!({
                                    "playerId": player_info.player_id
                                });
                                if socket.emit("player-assigned", &assignment).is_err() {
                                    warn!("Failed to send assignment to player {}", data.player_name);
                                }
                                
                                info!("Player {} assigned as {}", data.player_name, 
                                      player_info.player_id.as_ref().unwrap());
                            }
                            Err(error) => {
                                warn!("Failed to add player {}: {}", data.player_name, error);
                                let error_response = serde_json::json!({
                                    "message": error,
                                    "code": "ASSIGNMENT_FAILED"
                                });
                                if socket.emit("error", &error_response).is_err() {
                                    warn!("Failed to send error response to rejected player: {}", data.player_name);
                                }
                                if socket.disconnect().is_err() {
                                    warn!("Failed to disconnect rejected player: {}", data.player_name);
                                }
                            }
                        }
                    });
                }
            });

            // Handle player actions with full validation
            socket.on("player-action", {
                let player_manager = Arc::clone(&player_manager);
                move |socket: SocketRef, Data::<PlayerActionRequest>(data)| {
                    let pm_clone = Arc::clone(&player_manager);
                    let socket_clone = socket.clone();
                    tokio::spawn(async move {
                        let pm = pm_clone.lock().await;
                        let socket_id = socket_clone.id.to_string();
                
                        // Validate that the player is connected and assigned
                        if let Some(player) = pm.get_player_by_socket(&socket_id) {
                            if let Some(player_id) = &player.player_id {
                                info!("Received action from {}: {} - {}", player_id, data.action, data.selection);
                                
                                // Create validated player action for admin client
                                let validated_action = ValidatedPlayerAction {
                                    player: player_id.clone(),
                                    action: data.action.clone(),
                                    selection: data.selection.clone(),
                                    timestamp: data.timestamp,
                                    socket_id: socket_id.clone(),
                                };
                                
                                // For now, accept all actions (admin client will validate)
                                // In production, add tournament state validation here
                                let response = ActionResponse {
                                    success: true,
                                    error: None,
                                };
                                
                                socket_clone.emit("action-result", &response).ok();
                                
                                // Broadcast the action to admin client via the global action handler
                                // This would be handled by a callback mechanism in full implementation
                                info!("Action validated and ready for admin processing: {:?}", validated_action);
                                
                            } else {
                                warn!("Action from connected but unassigned player: {}", socket_id);
                                let response = ActionResponse {
                                    success: false,
                                    error: Some("Player assignment required".to_string()),
                                };
                                socket_clone.emit("action-result", &response).ok();
                            }
                        } else {
                            warn!("Action from unknown socket: {}", socket_id);
                            let response = ActionResponse {
                                success: false,
                                error: Some("Player not connected".to_string()),
                            };
                            socket_clone.emit("action-result", &response).ok();
                        }
                    });
                }
            });

            // Handle ping/pong for heartbeat with logging
            socket.on("ping", move |socket: SocketRef| {
                if socket.emit("pong", &()).is_err() {
                    warn!("Failed to send pong response to socket: {}", socket.id);
                } else {
                    info!("Heartbeat - ping/pong with socket: {}", socket.id);
                }
            });

            // Handle disconnection
            socket.on_disconnect({
                let player_manager = Arc::clone(&player_manager);
                let status = Arc::clone(&status);
                move |socket: SocketRef, _reason: socketioxide::socket::DisconnectReason| {
                    let pm_clone = Arc::clone(&player_manager);
                    let status_clone = Arc::clone(&status);
                    tokio::spawn(async move {
                        info!("Client disconnected: {}", socket.id);
                        
                        let mut pm = pm_clone.lock().await;
                        pm.remove_player_by_socket(&socket.id.to_string());
                        
                        // Update player count
                        let mut s = status_clone.lock().await;
                        s.player_count = pm.get_connected_count();
                    });
                }
            });
        });
    }
}

