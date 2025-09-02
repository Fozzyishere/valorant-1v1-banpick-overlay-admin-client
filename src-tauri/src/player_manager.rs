use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::{info, warn};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerInfo {
    pub name: String,
    pub socket_id: String,
    pub player_id: Option<String>, // "P1" or "P2"
    pub connected: bool,
    pub connection_time: u64,
}

#[derive(Debug)]
pub struct PlayerManager {
    players: HashMap<String, PlayerInfo>, // socket_id -> PlayerInfo
    assignments: HashMap<String, String>, // player_id ("P1"/"P2") -> socket_id
}

impl PlayerManager {
    pub fn new() -> Self {
        Self {
            players: HashMap::new(),
            assignments: HashMap::new(),
        }
    }

    pub fn add_player(&mut self, name: &str, socket_id: &str) -> Result<PlayerInfo, String> {
        // Check if this socket is already connected
        if self.players.contains_key(socket_id) {
            return Err("Socket already connected".to_string());
        }

        // Determine player assignment (P1 first, then P2, reject third)
        let player_id = if !self.assignments.contains_key("P1") {
            Some("P1".to_string())
        } else if !self.assignments.contains_key("P2") {
            Some("P2".to_string())
        } else {
            // Third player - reject
            warn!("Rejecting third player connection attempt: {}", name);
            return Err("Tournament is full (2 players maximum)".to_string());
        };

        let player_info = PlayerInfo {
            name: name.to_string(),
            socket_id: socket_id.to_string(),
            player_id: player_id.clone(),
            connected: true,
            connection_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs(),
        };

        // Add to collections
        self.players.insert(socket_id.to_string(), player_info.clone());
        if let Some(ref pid) = player_id {
            self.assignments.insert(pid.clone(), socket_id.to_string());
            info!("Player {} assigned as {} (socket: {})", name, pid, socket_id);
        }

        Ok(player_info)
    }

    /// Remove player by socket ID
    pub fn remove_player_by_socket(&mut self, socket_id: &str) -> Option<PlayerInfo> {
        if let Some(player) = self.players.remove(socket_id) {
            // Remove from assignments if assigned
            if let Some(ref player_id) = player.player_id {
                self.assignments.remove(player_id);
                info!("Player {} ({}) disconnected", player.name, player_id);
            } else {
                info!("Unassigned player {} disconnected", player.name);
            }
            Some(player)
        } else {
            None
        }
    }

    /// Get player info by socket ID
    pub fn get_player_by_socket(&self, socket_id: &str) -> Option<&PlayerInfo> {
        self.players.get(socket_id)
    }

    /// Get player info by player ID (P1/P2)
    pub fn get_player_by_id(&self, player_id: &str) -> Option<&PlayerInfo> {
        if let Some(socket_id) = self.assignments.get(player_id) {
            self.players.get(socket_id)
        } else {
            None
        }
    }

    /// Get all connected players
    pub fn get_all_players(&self) -> Vec<PlayerInfo> {
        self.players.values().cloned().collect()
    }

    /// Get count of connected players
    pub fn get_connected_count(&self) -> usize {
        self.players.len()
    }

    /// Check if a specific player ID is assigned
    pub fn is_player_assigned(&self, player_id: &str) -> bool {
        self.assignments.contains_key(player_id)
    }

    /// Get the socket ID for a player ID
    pub fn get_socket_for_player(&self, player_id: &str) -> Option<&String> {
        self.assignments.get(player_id)
    }

    /// Disconnect all players (for server shutdown)
    pub fn disconnect_all_players(&mut self) {
        let player_count = self.players.len();
        self.players.clear();
        self.assignments.clear();
        info!("Disconnected {} players", player_count);
    }

    /// Handle player reconnection (preserve P1/P2 assignment if possible)
    pub fn handle_reconnection(&mut self, name: &str, socket_id: &str) -> Result<PlayerInfo, String> {
        // Advanced reconnection logic will be added later when implementation requires
        self.add_player(name, socket_id)
    }

    /// Get current assignments status
    pub fn get_assignment_status(&self) -> (bool, bool) {
        (
            self.assignments.contains_key("P1"),
            self.assignments.contains_key("P2"),
        )
    }

    /// Get detailed status for admin UI
    pub fn get_detailed_status(&self) -> HashMap<String, serde_json::Value> {
        let mut status = HashMap::new();
        
        status.insert("total_players".to_string(), serde_json::Value::Number(
            serde_json::Number::from(self.players.len())
        ));
        
        status.insert("p1_assigned".to_string(), serde_json::Value::Bool(
            self.assignments.contains_key("P1")
        ));
        
        status.insert("p2_assigned".to_string(), serde_json::Value::Bool(
            self.assignments.contains_key("P2")
        ));

        // Add player details
        let mut players_detail = serde_json::Map::new();
        for (player_id, socket_id) in &self.assignments {
            if let Some(player) = self.players.get(socket_id) {
                players_detail.insert(player_id.clone(), serde_json::json!({
                    "name": player.name,
                    "connected": player.connected,
                    "connection_time": player.connection_time
                }));
            }
        }
        status.insert("players".to_string(), serde_json::Value::Object(players_detail));

        status
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_player_assignment() {
        let mut pm = PlayerManager::new();
        
        // First player should get P1
        let p1 = pm.add_player("Alice", "socket1").unwrap();
        assert_eq!(p1.player_id, Some("P1".to_string()));
        
        // Second player should get P2
        let p2 = pm.add_player("Bob", "socket2").unwrap();
        assert_eq!(p2.player_id, Some("P2".to_string()));
        
        // Third player should be rejected
        let p3_result = pm.add_player("Charlie", "socket3");
        assert!(p3_result.is_err());
        assert!(p3_result.unwrap_err().contains("full"));
    }

    #[test]
    fn test_player_removal() {
        let mut pm = PlayerManager::new();
        
        pm.add_player("Alice", "socket1").unwrap();
        pm.add_player("Bob", "socket2").unwrap();
        
        assert_eq!(pm.get_connected_count(), 2);
        assert!(pm.is_player_assigned("P1"));
        assert!(pm.is_player_assigned("P2"));
        
        // Remove P1
        pm.remove_player_by_socket("socket1");
        assert_eq!(pm.get_connected_count(), 1);
        assert!(!pm.is_player_assigned("P1"));
        assert!(pm.is_player_assigned("P2"));
        
        // Add another player - should get P1 again
        let new_p1 = pm.add_player("Charlie", "socket3").unwrap();
        assert_eq!(new_p1.player_id, Some("P1".to_string()));
    }
}