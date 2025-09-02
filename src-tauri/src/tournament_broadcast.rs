use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tracing::info;

// Tournament state structure that matches the admin client types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TournamentState {
    // Phase and turn tracking
    #[serde(rename = "currentPhase")]
    pub current_phase: String, // "MAP_PHASE" | "AGENT_PHASE" | "CONCLUSION"
    
    #[serde(rename = "currentPlayer")]
    pub current_player: Option<String>, // "P1" | "P2"
    
    #[serde(rename = "actionNumber")]
    pub action_number: i32, // 1-17
    
    #[serde(rename = "firstPlayer")]
    pub first_player: String, // "P1" | "P2"
    
    #[serde(rename = "eventStarted")]
    pub event_started: Option<bool>,
    
    // Team configuration
    #[serde(rename = "teamNames")]
    pub team_names: HashMap<String, String>, // P1/P2 -> team names
    
    // Map state
    #[serde(rename = "mapsBanned")]
    pub maps_banned: Vec<AssetSelection>,
    
    #[serde(rename = "mapsPicked")]
    pub maps_picked: Vec<AssetSelection>,
    
    #[serde(rename = "deciderMap")]
    pub decider_map: Option<String>,
    
    // Agent state
    #[serde(rename = "agentsBanned")]
    pub agents_banned: Vec<AssetSelection>,
    
    #[serde(rename = "agentPicks")]
    pub agent_picks: HashMap<String, Option<String>>, // P1/P2 -> agent
    
    // Timer state
    #[serde(rename = "timerState")]
    pub timer_state: String, // "ready" | "running" | "paused" | "finished"
    
    #[serde(rename = "timerSeconds")]
    pub timer_seconds: i32,
    
    // OBS timing flow state
    #[serde(rename = "pendingSelection")]
    pub pending_selection: Option<String>,
    
    #[serde(rename = "revealedActions")]
    pub revealed_actions: Vec<i32>,
    
    // Action history
    #[serde(rename = "actionHistory")]
    pub action_history: Vec<TournamentAction>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssetSelection {
    pub name: String,
    pub player: String, // "P1" | "P2"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TournamentAction {
    #[serde(rename = "actionNumber")]
    pub action_number: i32,
    
    pub player: String, // "P1" | "P2"
    
    #[serde(rename = "actionType")]
    pub action_type: String, // "MAP_BAN" | "MAP_PICK" | "DECIDER" | "AGENT_BAN" | "AGENT_PICK"
    
    pub selection: String,
    pub timestamp: u64,
}

// Player-compatible state format
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerGameState {
    // Current game state
    pub phase: String, // "MAP_BAN" | "MAP_PICK" | "AGENT_BAN" | "AGENT_PICK" | "CONCLUSION"
    
    #[serde(rename = "currentPlayer")]
    pub current_player: Option<String>, // "P1" | "P2"
    
    #[serde(rename = "currentAction")]
    pub current_action: Option<String>, // "BAN" | "PICK" | "DECIDER"
    
    // Game data
    pub maps: Option<MapState>,
    pub agents: Option<AgentState>,
    
    #[serde(rename = "actionHistory")]
    pub action_history: Option<Vec<PlayerAction>>,
    
    // Timer information
    #[serde(rename = "timerState")]
    pub timer_state: String,
    
    #[serde(rename = "timeRemaining")]
    pub time_remaining: i32,
    
    // Team information
    #[serde(rename = "teamNames")]
    pub team_names: Option<HashMap<String, String>>,
    
    // Tournament metadata
    #[serde(rename = "turnNumber")]
    pub turn_number: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MapState {
    pub banned: Vec<PlayerAsset>,
    pub picked: Vec<PlayerAsset>,
    pub decider: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentState {
    pub banned: Vec<PlayerAsset>,
    #[serde(rename = "p1Pick")]
    pub p1_pick: Option<String>,
    #[serde(rename = "p2Pick")]
    pub p2_pick: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerAsset {
    pub name: String,
    pub player: String, // "P1" | "P2"
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerAction {
    pub player: String, // "P1" | "P2"
    pub action: String, // "BAN" | "PICK" | "DECIDER"
    pub selection: String,
    pub timestamp: u64,
}

/// Transform admin tournament state to player-compatible format
pub fn transform_for_players(admin_state: &TournamentState) -> PlayerGameState {
    info!("Transforming admin state for player broadcast");

    // Map admin phases to player phases
    let phase = match admin_state.current_phase.as_str() {
        "MAP_PHASE" => {
            // Determine specific map phase action based on action number
            if admin_state.action_number <= 6 {
                "MAP_BAN".to_string()
            } else if admin_state.action_number <= 8 {
                "MAP_PICK".to_string()
            } else if admin_state.action_number == 9 {
                "DECIDER".to_string()
            } else {
                "MAP_PHASE".to_string() // Fallback
            }
        }
        "AGENT_PHASE" => {
            if admin_state.action_number <= 15 {
                "AGENT_BAN".to_string()
            } else {
                "AGENT_PICK".to_string()
            }
        }
        _ => admin_state.current_phase.clone(),
    };

    // Determine current action
    let current_action = match phase.as_str() {
        "MAP_BAN" | "AGENT_BAN" => Some("BAN".to_string()),
        "MAP_PICK" | "AGENT_PICK" => Some("PICK".to_string()),
        "DECIDER" => Some("DECIDER".to_string()),
        _ => None,
    };

    // Transform map state
    let maps = Some(MapState {
        banned: admin_state
            .maps_banned
            .iter()
            .map(|asset| PlayerAsset {
                name: asset.name.clone(),
                player: asset.player.clone(),
            })
            .collect(),
        picked: admin_state
            .maps_picked
            .iter()
            .map(|asset| PlayerAsset {
                name: asset.name.clone(),
                player: asset.player.clone(),
            })
            .collect(),
        decider: admin_state.decider_map.clone(),
    });

    // Transform agent state
    let agents = Some(AgentState {
        banned: admin_state
            .agents_banned
            .iter()
            .map(|asset| PlayerAsset {
                name: asset.name.clone(),
                player: asset.player.clone(),
            })
            .collect(),
        p1_pick: admin_state.agent_picks.get("P1").and_then(|x| x.clone()),
        p2_pick: admin_state.agent_picks.get("P2").and_then(|x| x.clone()),
    });

    // Transform action history
    let action_history = Some(
        admin_state
            .action_history
            .iter()
            .map(|action| {
                let action_type = match action.action_type.as_str() {
                    "MAP_BAN" | "AGENT_BAN" => "BAN",
                    "MAP_PICK" | "AGENT_PICK" => "PICK",
                    "DECIDER" => "DECIDER",
                    _ => "BAN", // Fallback
                };

                PlayerAction {
                    player: action.player.clone(),
                    action: action_type.to_string(),
                    selection: action.selection.clone(),
                    timestamp: action.timestamp,
                }
            })
            .collect(),
    );

    PlayerGameState {
        phase,
        current_player: admin_state.current_player.clone(),
        current_action,
        maps,
        agents,
        action_history,
        timer_state: admin_state.timer_state.clone(),
        time_remaining: admin_state.timer_seconds,
        team_names: Some(admin_state.team_names.clone()),
        turn_number: admin_state.action_number,
    }
}

/// Create turn start event for specific player
pub fn create_turn_start_event(
    admin_state: &TournamentState,
    target_player: &str,
    available_options: Vec<String>,
    time_limit: i32,
) -> TurnStartEvent {
    let phase = match admin_state.current_phase.as_str() {
        "MAP_PHASE" => {
            if admin_state.action_number <= 6 {
                "MAP_BAN"
            } else if admin_state.action_number <= 8 {
                "MAP_PICK"
            } else {
                "DECIDER"
            }
        }
        "AGENT_PHASE" => {
            if admin_state.action_number <= 15 {
                "AGENT_BAN"
            } else {
                "AGENT_PICK"
            }
        }
        _ => "BAN", // Fallback
    };

    let action = match phase {
        "MAP_BAN" | "AGENT_BAN" => "BAN",
        "MAP_PICK" | "AGENT_PICK" => "PICK",
        "DECIDER" => "DECIDER",
        _ => "BAN",
    };

    TurnStartEvent {
        player: target_player.to_string(),
        time_limit,
        phase: phase.to_string(),
        action: action.to_string(),
        available_options,
        tournament_state: transform_for_players(admin_state),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TurnStartEvent {
    pub player: String, // "P1" | "P2"
    #[serde(rename = "timeLimit")]
    pub time_limit: i32,
    pub phase: String,
    pub action: String,
    #[serde(rename = "availableOptions")]
    pub available_options: Vec<String>,
    #[serde(rename = "tournamentState")]
    pub tournament_state: PlayerGameState,
}

/// Calculate available options based on current tournament state and action
pub fn get_available_options(admin_state: &TournamentState) -> Vec<String> {
    let all_maps = vec![
        "abyss", "ascent", "bind", "breeze", "corrode", "fracture",
        "haven", "icebox", "lotus", "pearl", "split", "sunset"
    ];
    
    let all_agents = vec![
        "astra", "breach", "brimstone", "chamber", "clove", "cypher",
        "deadlock", "fade", "gekko", "harbor", "iso", "jett", "kayo",
        "killjoy", "neon", "omen", "phoenix", "raze", "reyna", "sage",
        "skye", "sova", "tejo", "viper", "vyse", "waylay", "yoru"
    ];

    match admin_state.current_phase.as_str() {
        "MAP_PHASE" => {
            if admin_state.action_number == 9 {
                // Decider selection - only picked maps are available
                admin_state.maps_picked.iter()
                    .map(|pick| pick.name.clone())
                    .collect()
            } else {
                // Map bans/picks - exclude already banned/picked
                let banned: Vec<&String> = admin_state.maps_banned.iter()
                    .map(|ban| &ban.name)
                    .collect();
                let picked: Vec<&String> = admin_state.maps_picked.iter()
                    .map(|pick| &pick.name)
                    .collect();

                all_maps.into_iter()
                    .filter(|map| !banned.iter().any(|b| b == map) && !picked.iter().any(|p| p == map))
                    .map(|map| map.to_string())
                    .collect()
            }
        }
        "AGENT_PHASE" => {
            // Agent bans/picks - exclude already banned/picked
            let banned: Vec<&String> = admin_state.agents_banned.iter()
                .map(|ban| &ban.name)
                .collect();
            let picked: Vec<String> = admin_state.agent_picks.values()
                .filter_map(|pick| pick.clone())
                .collect();
            let picked_refs: Vec<&String> = picked.iter().collect();

            all_agents.into_iter()
                .filter(|agent| !banned.iter().any(|b| b == agent) && !picked_refs.iter().any(|p| p == agent))
                .map(|agent| agent.to_string())
                .collect()
        }
        _ => vec![], // No options available
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_transform_for_players() {
        let mut admin_state = TournamentState {
            current_phase: "MAP_PHASE".to_string(),
            current_player: Some("P1".to_string()),
            action_number: 1,
            first_player: "P1".to_string(),
            event_started: Some(true),
            team_names: {
                let mut map = HashMap::new();
                map.insert("P1".to_string(), "Team Alpha".to_string());
                map.insert("P2".to_string(), "Team Beta".to_string());
                map
            },
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
        };

        let player_state = transform_for_players(&admin_state);
        
        assert_eq!(player_state.phase, "MAP_BAN");
        assert_eq!(player_state.current_player, Some("P1".to_string()));
        assert_eq!(player_state.current_action, Some("BAN".to_string()));
        assert_eq!(player_state.turn_number, 1);
    }

    #[test]
    fn test_available_options() {
        let admin_state = TournamentState {
            current_phase: "MAP_PHASE".to_string(),
            current_player: Some("P1".to_string()),
            action_number: 1,
            first_player: "P1".to_string(),
            event_started: Some(true),
            team_names: HashMap::new(),
            maps_banned: vec![AssetSelection {
                name: "bind".to_string(),
                player: "P1".to_string(),
            }],
            maps_picked: vec![],
            decider_map: None,
            agents_banned: vec![],
            agent_picks: HashMap::new(),
            timer_state: "running".to_string(),
            timer_seconds: 30,
            pending_selection: None,
            revealed_actions: vec![],
            action_history: vec![],
        };

        let options = get_available_options(&admin_state);
        
        // Should include all maps except "bind" which is banned
        assert!(!options.contains(&"bind".to_string()));
        assert!(options.contains(&"ascent".to_string()));
        assert!(options.len() == 11); // 12 total - 1 banned
    }
}