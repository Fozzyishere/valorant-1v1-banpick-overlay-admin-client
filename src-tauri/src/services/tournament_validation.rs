// Tournament Validation Service - Server-side action validation

use tracing::{info, warn, debug};
use crate::services::tournament_service::{TournamentState, AssetSelection};
use crate::utils::{ALL_MAPS, ALL_AGENTS};

#[derive(Debug, Clone)]
pub enum ValidationError {
    // Player validation errors
    InvalidPlayer { received: String, expected: String },
    NotPlayerTurn { received: String, current: String },

    // Game state validation errors
    EventNotStarted,
    InvalidPhase { action: String, current_phase: String },
    InvalidActionNumber { received: i32, expected: i32 },

    // Asset validation errors
    AssetNotFound { asset: String, asset_type: String },
    AssetAlreadyBanned { asset: String, player: String },
    AssetAlreadyPicked { asset: String, player: String },
    DeciderNotFromPickedMaps { asset: String, picked_maps: Vec<String> },

    // Timer validation errors
    TimerNotRunning { current_state: String },
    ActionAfterTimeExpired,

    // General validation errors
    UnknownActionType { action: String },
    TournamentCompleted,
}

impl ValidationError {
    pub fn to_error_message(&self) -> String {
        match self {
            ValidationError::InvalidPlayer { received, expected } => {
                format!("Invalid player '{}'. Expected '{}'.", received, expected)
            }
            ValidationError::NotPlayerTurn { received, current } => {
                format!("Not your turn. Player '{}' submitted action, but it's {}'s turn.", received, current)
            }
            ValidationError::EventNotStarted => {
                "Tournament has not started yet. Wait for the admin to start the event.".to_string()
            }
            ValidationError::InvalidPhase { action, current_phase } => {
                format!("Invalid action '{}' for current phase '{}'. Check the tournament progression.", action, current_phase)
            }
            ValidationError::InvalidActionNumber { received, expected } => {
                format!("Action submitted for turn {}, but current turn is {}. Please sync with current game state.", received, expected)
            }
            ValidationError::AssetNotFound { asset, asset_type } => {
                format!("Unknown {} '{}'. Please select from available options.", asset_type, asset)
            }
            ValidationError::AssetAlreadyBanned { asset, player } => {
                format!("'{}' was already banned by {}. Choose a different option.", asset, player)
            }
            ValidationError::AssetAlreadyPicked { asset, player } => {
                format!("'{}' was already picked by {}. Choose a different option.", asset, player)
            }
            ValidationError::DeciderNotFromPickedMaps { asset, picked_maps } => {
                format!("Decider map '{}' must be selected from picked maps: {}. Please choose from the available options.",
                       asset, picked_maps.join(", "))
            }
            ValidationError::TimerNotRunning { current_state } => {
                format!("Cannot submit action when timer is '{}'. Wait for timer to start.", current_state)
            }
            ValidationError::ActionAfterTimeExpired => {
                "Time has expired for this turn. Please wait for the next turn to begin.".to_string()
            }
            ValidationError::UnknownActionType { action } => {
                format!("Unknown action type '{}'. Valid actions are BAN, PICK, DECIDER.", action)
            }
            ValidationError::TournamentCompleted => {
                "Tournament has already completed. No further actions are allowed.".to_string()
            }
        }
    }

    pub fn to_error_code(&self) -> &'static str {
        match self {
            ValidationError::InvalidPlayer { .. } => "INVALID_PLAYER",
            ValidationError::NotPlayerTurn { .. } => "NOT_PLAYER_TURN",
            ValidationError::EventNotStarted => "EVENT_NOT_STARTED",
            ValidationError::InvalidPhase { .. } => "INVALID_PHASE",
            ValidationError::InvalidActionNumber { .. } => "INVALID_ACTION_NUMBER",
            ValidationError::AssetNotFound { .. } => "ASSET_NOT_FOUND",
            ValidationError::AssetAlreadyBanned { .. } => "ASSET_ALREADY_BANNED",
            ValidationError::AssetAlreadyPicked { .. } => "ASSET_ALREADY_PICKED",
            ValidationError::DeciderNotFromPickedMaps { .. } => "DECIDER_INVALID",
            ValidationError::TimerNotRunning { .. } => "TIMER_NOT_RUNNING",
            ValidationError::ActionAfterTimeExpired => "TIME_EXPIRED",
            ValidationError::UnknownActionType { .. } => "UNKNOWN_ACTION",
            ValidationError::TournamentCompleted => "TOURNAMENT_COMPLETED",
        }
    }
}

pub struct TournamentValidator;

impl TournamentValidator {
    /// Validate a player action against the current tournament state
    pub fn validate_player_action(
        tournament_state: &TournamentState,
        player_id: &str,
        action: &str,
        selection: &str,
    ) -> Result<(), ValidationError> {
        info!("Validating action: player={}, action={}, selection={}", player_id, action, selection);

        if tournament_state.event_started != Some(true) {
            warn!("Action rejected: tournament not started");
            return Err(ValidationError::EventNotStarted);
        }

        if tournament_state.current_phase == "CONCLUSION" {
            warn!("Action rejected: tournament completed");
            return Err(ValidationError::TournamentCompleted);
        }

        match &tournament_state.current_player {
            Some(current_player) => {
                if current_player != player_id {
                    warn!("Action rejected: not player's turn (expected: {}, received: {})", current_player, player_id);
                    return Err(ValidationError::NotPlayerTurn {
                        received: player_id.to_string(),
                        current: current_player.clone(),
                    });
                }
            }
            None => {
                warn!("Action rejected: no current player set");
                return Err(ValidationError::InvalidPlayer {
                    received: player_id.to_string(),
                    expected: "valid player".to_string(),
                });
            }
        }

        if tournament_state.timer_state == "ready" {
            debug!("Warning: Action submitted before timer started, but allowing for flexibility");
        }

        let expected_action = Self::get_expected_action_type(&tournament_state);

        match action {
            "BAN" => {
                if !matches!(expected_action.as_str(), "MAP_BAN" | "AGENT_BAN") {
                    return Err(ValidationError::InvalidPhase {
                        action: action.to_string(),
                        current_phase: tournament_state.current_phase.clone(),
                    });
                }
            }
            "PICK" => {
                if !matches!(expected_action.as_str(), "MAP_PICK" | "AGENT_PICK") {
                    return Err(ValidationError::InvalidPhase {
                        action: action.to_string(),
                        current_phase: tournament_state.current_phase.clone(),
                    });
                }
            }
            "DECIDER" => {
                if expected_action != "DECIDER" {
                    return Err(ValidationError::InvalidPhase {
                        action: action.to_string(),
                        current_phase: tournament_state.current_phase.clone(),
                    });
                }
            }
            _ => {
                return Err(ValidationError::UnknownActionType {
                    action: action.to_string(),
                });
            }
        }

        Self::validate_asset_selection(tournament_state, &expected_action, selection)?;

        info!("Action validation successful: player={}, action={}, selection={}", player_id, action, selection);
        Ok(())
    }

    /// Get the expected action type for the current tournament state
    fn get_expected_action_type(tournament_state: &TournamentState) -> String {
        match tournament_state.current_phase.as_str() {
            "MAP_PHASE" => {
                if tournament_state.action_number <= 6 {
                    "MAP_BAN".to_string()
                } else if tournament_state.action_number <= 8 {
                    "MAP_PICK".to_string()
                } else if tournament_state.action_number == 9 {
                    "DECIDER".to_string()
                } else {
                    "UNKNOWN".to_string()
                }
            }
            "AGENT_PHASE" => {
                if tournament_state.action_number <= 15 {
                    "AGENT_BAN".to_string()
                } else if tournament_state.action_number <= 17 {
                    "AGENT_PICK".to_string()
                } else {
                    "UNKNOWN".to_string()
                }
            }
            _ => "UNKNOWN".to_string(),
        }
    }

    /// Validate that the selected asset is valid for the current action
    fn validate_asset_selection(
        tournament_state: &TournamentState,
        action_type: &str,
        selection: &str,
    ) -> Result<(), ValidationError> {
        match action_type {
            "MAP_BAN" | "MAP_PICK" => {
                // Validate asset exists in map pool
                if !ALL_MAPS.contains(&selection) {
                    return Err(ValidationError::AssetNotFound {
                        asset: selection.to_string(),
                        asset_type: "map".to_string(),
                    });
                }

                // Check if already banned
                for banned in &tournament_state.maps_banned {
                    if banned.name == selection {
                        return Err(ValidationError::AssetAlreadyBanned {
                            asset: selection.to_string(),
                            player: banned.player.clone(),
                        });
                    }
                }

                // Check if already picked
                for picked in &tournament_state.maps_picked {
                    if picked.name == selection {
                        return Err(ValidationError::AssetAlreadyPicked {
                            asset: selection.to_string(),
                            player: picked.player.clone(),
                        });
                    }
                }
            }
            "DECIDER" => {
                // Validate decider is from picked maps
                let picked_map_names: Vec<String> = tournament_state
                    .maps_picked
                    .iter()
                    .map(|pick| pick.name.clone())
                    .collect();

                if !picked_map_names.contains(&selection.to_string()) {
                    return Err(ValidationError::DeciderNotFromPickedMaps {
                        asset: selection.to_string(),
                        picked_maps: picked_map_names,
                    });
                }
            }
            "AGENT_BAN" | "AGENT_PICK" => {
                // Validate asset exists in agent pool
                if !ALL_AGENTS.contains(&selection) {
                    return Err(ValidationError::AssetNotFound {
                        asset: selection.to_string(),
                        asset_type: "agent".to_string(),
                    });
                }

                // Check if already banned
                for banned in &tournament_state.agents_banned {
                    if banned.name == selection {
                        return Err(ValidationError::AssetAlreadyBanned {
                            asset: selection.to_string(),
                            player: banned.player.clone(),
                        });
                    }
                }

                // Check if already picked
                for (player, picked_agent) in &tournament_state.agent_picks {
                    if let Some(agent) = picked_agent {
                        if agent == selection {
                            return Err(ValidationError::AssetAlreadyPicked {
                                asset: selection.to_string(),
                                player: player.clone(),
                            });
                        }
                    }
                }
            }
            _ => {
                return Err(ValidationError::UnknownActionType {
                    action: action_type.to_string(),
                });
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    fn create_test_tournament_state() -> TournamentState {
        TournamentState {
            current_phase: "MAP_PHASE".to_string(),
            current_player: Some("P1".to_string()),
            action_number: 1,
            first_player: "P1".to_string(),
            event_started: Some(true),
            team_names: HashMap::new(),
            maps_banned: vec![],
            maps_picked: vec![],
            decider_map: None,
            agents_banned: vec![],
            agent_picks: HashMap::new(),
            timer_state: "running".to_string(),
            timer_seconds: 30,
            pending_selection: None,
            revealed_actions: vec![],
            action_history: vec![],
        }
    }

    #[test]
    fn test_valid_map_ban() {
        let state = create_test_tournament_state();
        let result = TournamentValidator::validate_player_action(&state, "P1", "BAN", "bind");
        assert!(result.is_ok());
    }

    #[test]
    fn test_invalid_player_turn() {
        let state = create_test_tournament_state();
        let result = TournamentValidator::validate_player_action(&state, "P2", "BAN", "bind");
        assert!(result.is_err());

        if let Err(ValidationError::NotPlayerTurn { received, current }) = result {
            assert_eq!(received, "P2");
            assert_eq!(current, "P1");
        } else {
            panic!("Expected NotPlayerTurn error");
        }
    }

    #[test]
    fn test_invalid_asset() {
        let state = create_test_tournament_state();
        let result = TournamentValidator::validate_player_action(&state, "P1", "BAN", "invalid_map");
        assert!(result.is_err());

        if let Err(ValidationError::AssetNotFound { asset, asset_type }) = result {
            assert_eq!(asset, "invalid_map");
            assert_eq!(asset_type, "map");
        } else {
            panic!("Expected AssetNotFound error");
        }
    }

    #[test]
    fn test_already_banned_asset() {
        let mut state = create_test_tournament_state();
        state.maps_banned.push(AssetSelection {
            name: "bind".to_string(),
            player: "P1".to_string(),
        });

        let result = TournamentValidator::validate_player_action(&state, "P1", "BAN", "bind");
        assert!(result.is_err());

        if let Err(ValidationError::AssetAlreadyBanned { asset, player }) = result {
            assert_eq!(asset, "bind");
            assert_eq!(player, "P1");
        } else {
            panic!("Expected AssetAlreadyBanned error");
        }
    }

    #[test]
    fn test_event_not_started() {
        let mut state = create_test_tournament_state();
        state.event_started = Some(false);

        let result = TournamentValidator::validate_player_action(&state, "P1", "BAN", "bind");
        assert!(result.is_err());

        if let Err(ValidationError::EventNotStarted) = result {
            // Expected
        } else {
            panic!("Expected EventNotStarted error");
        }
    }
}