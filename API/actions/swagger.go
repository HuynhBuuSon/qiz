package actions

import (
	"net/http"

	"github.com/gobuffalo/buffalo"
)

// swaggerSpec is the OpenAPI 3.0 specification for this API.
var swaggerSpec = map[string]any{
	"openapi": "3.0.0",
	"info": map[string]any{
		"title":       "Qiz API",
		"version":     "1.0.0",
		"description": "Game room management API",
	},
	"servers": []map[string]any{
		{"url": "http://localhost:3001/api"},
	},
	"paths": map[string]any{
		"/rooms": map[string]any{
			"get": map[string]any{
				"summary":     "List all game rooms",
				"operationId": "listRooms",
				"tags":        []string{"rooms"},
				"responses": map[string]any{
					"200": map[string]any{"description": "OK", "content": jsonArray("GameRoom")},
				},
			},
			"post": map[string]any{
				"summary":     "Create a game room",
				"operationId": "createRoom",
				"tags":        []string{"rooms"},
				"requestBody": jsonBody("CreateRoomRequest"),
				"responses": map[string]any{
					"200": map[string]any{"description": "Created", "content": jsonRef("GameRoom")},
				},
			},
		},
		"/rooms/{room_id}": map[string]any{
			"parameters": []map[string]any{pathParam("room_id")},
			"get": map[string]any{
				"summary": "Get a game room", "operationId": "getRoom", "tags": []string{"rooms"},
				"responses": map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("GameRoom")}},
			},
			"patch": map[string]any{
				"summary": "Update a game room", "operationId": "patchRoom", "tags": []string{"rooms"},
				"requestBody": jsonBody("PatchRoomRequest"),
				"responses":   map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("GameRoom")}},
			},
		},
		"/rooms/{room_id}/players": map[string]any{
			"parameters": []map[string]any{pathParam("room_id")},
			"get": map[string]any{
				"summary": "List players", "operationId": "listPlayers", "tags": []string{"players"},
				"responses": map[string]any{"200": map[string]any{"description": "OK", "content": jsonArray("Player")}},
			},
			"post": map[string]any{
				"summary": "Add a player", "operationId": "createPlayer", "tags": []string{"players"},
				"requestBody": jsonBody("CreatePlayerRequest"),
				"responses":   map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("Player")}},
			},
		},
		"/rooms/{room_id}/players/{player_id}": map[string]any{
			"parameters": []map[string]any{pathParam("room_id"), pathParam("player_id")},
			"get": map[string]any{
				"summary": "Get a player", "operationId": "getPlayer", "tags": []string{"players"},
				"responses": map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("Player")}},
			},
			"patch": map[string]any{
				"summary": "Update a player", "operationId": "patchPlayer", "tags": []string{"players"},
				"requestBody": jsonBody("PatchPlayerRequest"),
				"responses":   map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("Player")}},
			},
			"delete": map[string]any{
				"summary": "Delete a player", "operationId": "deletePlayer", "tags": []string{"players"},
				"responses": map[string]any{"200": map[string]any{"description": "OK"}},
			},
		},
		"/rooms/{room_id}/games": map[string]any{
			"parameters": []map[string]any{pathParam("room_id")},
			"get": map[string]any{
				"summary": "List games", "operationId": "listGames", "tags": []string{"games"},
				"responses": map[string]any{"200": map[string]any{"description": "OK", "content": jsonArray("Game")}},
			},
			"post": map[string]any{
				"summary": "Create a game", "operationId": "createGame", "tags": []string{"games"},
				"requestBody": jsonBody("CreateGameRequest"),
				"responses":   map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("Game")}},
			},
		},
		"/rooms/{room_id}/games/{game_id}": map[string]any{
			"parameters": []map[string]any{pathParam("room_id"), pathParam("game_id")},
			"get": map[string]any{
				"summary": "Get a game", "operationId": "getGame", "tags": []string{"games"},
				"responses": map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("Game")}},
			},
			"patch": map[string]any{
				"summary": "Update a game", "operationId": "patchGame", "tags": []string{"games"},
				"requestBody": jsonBody("PatchGameRequest"),
				"responses":   map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("Game")}},
			},
			"delete": map[string]any{
				"summary": "Delete a game", "operationId": "deleteGame", "tags": []string{"games"},
				"responses": map[string]any{"200": map[string]any{"description": "OK"}},
			},
		},
		"/rooms/{room_id}/games/{game_id}/results": map[string]any{
			"parameters": []map[string]any{pathParam("room_id"), pathParam("game_id")},
			"get": map[string]any{
				"summary": "List results", "operationId": "listResults", "tags": []string{"results"},
				"responses": map[string]any{"200": map[string]any{"description": "OK", "content": jsonArray("GameResult")}},
			},
			"post": map[string]any{
				"summary": "Submit a result", "operationId": "createResult", "tags": []string{"results"},
				"requestBody": jsonBody("CreateResultRequest"),
				"responses":   map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("GameResult")}},
			},
			"put": map[string]any{
				"summary": "Batch submit results", "operationId": "batchResults", "tags": []string{"results"},
				"requestBody": jsonBody("BatchResultsRequest"),
				"responses":   map[string]any{"200": map[string]any{"description": "OK", "content": jsonArray("GameResult")}},
			},
		},
		"/rooms/{room_id}/games/{game_id}/random/winner": map[string]any{
			"parameters": []map[string]any{pathParam("room_id"), pathParam("game_id")},
			"post": map[string]any{
				"summary": "Record random winner", "operationId": "createRandomWinner", "tags": []string{"random"},
				"requestBody": jsonBody("CreateRandomWinnerRequest"),
				"responses":   map[string]any{"200": map[string]any{"description": "OK", "content": jsonRef("RandomWinner")}},
			},
		},
		"/rooms/{room_id}/games/{game_id}/random/winners": map[string]any{
			"parameters": []map[string]any{pathParam("room_id"), pathParam("game_id")},
			"get": map[string]any{
				"summary": "List random winners", "operationId": "listRandomWinners", "tags": []string{"random"},
				"responses": map[string]any{"200": map[string]any{"description": "OK", "content": jsonArray("RandomWinner")}},
			},
		},
	},
	"components": map[string]any{
		"schemas": map[string]any{
			"GameRoom": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":                map[string]any{"type": "string", "format": "uuid"},
					"name":              map[string]any{"type": "string"},
					"room_number":       map[string]any{"type": "integer"},
					"join_code":         map[string]any{"type": "string"},
					"presentation_code": map[string]any{"type": "string"},
					"main_color":        map[string]any{"type": "string"},
					"color_from":        map[string]any{"type": "string"},
					"color_to":          map[string]any{"type": "string"},
					"max_players":       map[string]any{"type": "integer"},
					"point_mode":        map[string]any{"type": "string"},
					"point_from":        map[string]any{"type": "integer"},
					"point_to":          map[string]any{"type": "integer"},
					"created_at":        map[string]any{"type": "string", "format": "date-time"},
					"created_by":        map[string]any{"type": "string"},
					"status":            map[string]any{"type": "string"},
					"settings":          map[string]any{"type": "object"},
				},
			},
			"Player": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":              map[string]any{"type": "string", "format": "uuid"},
					"room_id":         map[string]any{"type": "string"},
					"name":            map[string]any{"type": "string"},
					"sequence_number": map[string]any{"type": "integer"},
					"joined_at":       map[string]any{"type": "string", "format": "date-time"},
					"score":           map[string]any{"type": "integer"},
					"rank":            map[string]any{"type": "integer"},
					"is_hidden_rank":  map[string]any{"type": "boolean"},
					"is_hidden_score": map[string]any{"type": "boolean"},
					"color":           map[string]any{"type": "string"},
					"metadata":        map[string]any{"type": "object"},
				},
			},
			"Game": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":         map[string]any{"type": "string", "format": "uuid"},
					"room_id":    map[string]any{"type": "string"},
					"name":       map[string]any{"type": "string"},
					"type":       map[string]any{"type": "string", "enum": []string{"weight", "random"}},
					"game_order": map[string]any{"type": "integer"},
					"status":     map[string]any{"type": "string"},
					"created_at": map[string]any{"type": "string", "format": "date-time"},
					"settings":   map[string]any{"type": "object"},
				},
			},
			"GameResult": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":            map[string]any{"type": "string", "format": "uuid"},
					"game_id":       map[string]any{"type": "string"},
					"player_id":     map[string]any{"type": "string"},
					"points_earned": map[string]any{"type": "integer"},
					"rank":          map[string]any{"type": "integer"},
					"created_at":    map[string]any{"type": "string", "format": "date-time"},
					"player_name":   map[string]any{"type": "string"},
				},
			},
			"RandomWinner": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"id":             map[string]any{"type": "string", "format": "uuid"},
					"game_id":        map[string]any{"type": "string"},
					"player_id":      map[string]any{"type": "string"},
					"admin_action":   map[string]any{"type": "string"},
					"points_awarded": map[string]any{"type": "integer"},
					"created_at":     map[string]any{"type": "string", "format": "date-time"},
				},
			},
			"CreateRoomRequest": map[string]any{
				"type": "object", "required": []string{"name"},
				"properties": map[string]any{
					"name":              map[string]any{"type": "string"},
					"mainColor":         map[string]any{"type": "string"},
					"colorFrom":         map[string]any{"type": "string"},
					"colorTo":           map[string]any{"type": "string"},
					"maxPlayers":        map[string]any{"type": "integer"},
					"pointMode":         map[string]any{"type": "string"},
					"pointFrom":         map[string]any{"type": "integer"},
					"pointTo":           map[string]any{"type": "integer"},
					"createdBy":         map[string]any{"type": "string"},
					"join_code":         map[string]any{"type": "string"},
					"presentation_code": map[string]any{"type": "string"},
				},
			},
			"PatchRoomRequest": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"mainColor": map[string]any{"type": "string"},
					"colorFrom": map[string]any{"type": "string"},
					"colorTo":   map[string]any{"type": "string"},
				},
			},
			"CreatePlayerRequest": map[string]any{
				"type": "object", "required": []string{"name"},
				"properties": map[string]any{"name": map[string]any{"type": "string"}},
			},
			"PatchPlayerRequest": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"name":          map[string]any{"type": "string"},
					"score":         map[string]any{"type": "integer"},
					"isScoreHidden": map[string]any{"type": "boolean"},
					"isRankHidden":  map[string]any{"type": "boolean"},
				},
			},
			"CreateGameRequest": map[string]any{
				"type": "object", "required": []string{"type"},
				"properties": map[string]any{
					"name":     map[string]any{"type": "string"},
					"type":     map[string]any{"type": "string", "enum": []string{"weight", "random"}},
					"settings": map[string]any{"type": "object"},
				},
			},
			"PatchGameRequest": map[string]any{
				"type": "object",
				"properties": map[string]any{
					"status":   map[string]any{"type": "string"},
					"config":   map[string]any{"type": "object"},
					"settings": map[string]any{"type": "object"},
				},
			},
			"CreateResultRequest": map[string]any{
				"type": "object", "required": []string{"playerId", "pointsEarned"},
				"properties": map[string]any{
					"playerId":     map[string]any{"type": "string"},
					"pointsEarned": map[string]any{"type": "integer"},
					"rank":         map[string]any{"type": "integer"},
				},
			},
			"BatchResultsRequest": map[string]any{
				"type": "object", "required": []string{"results"},
				"properties": map[string]any{
					"results": map[string]any{
						"type": "array",
						"items": map[string]any{
							"type": "object",
							"properties": map[string]any{
								"playerId":     map[string]any{"type": "string"},
								"pointsEarned": map[string]any{"type": "integer"},
								"rank":         map[string]any{"type": "integer"},
							},
						},
					},
				},
			},
			"CreateRandomWinnerRequest": map[string]any{
				"type": "object", "required": []string{"playerId", "action"},
				"properties": map[string]any{
					"playerId":      map[string]any{"type": "string"},
					"action":        map[string]any{"type": "string"},
					"pointsAwarded": map[string]any{"type": "integer"},
				},
			},
		},
	},
}

// SwaggerJSONHandler GET /api/swagger.json
func SwaggerJSONHandler(c buffalo.Context) error {
	return c.Render(http.StatusOK, r.JSON(swaggerSpec))
}

// --- tiny helpers for building the spec ---

func jsonRef(schema string) map[string]any {
	return map[string]any{
		"application/json": map[string]any{
			"schema": map[string]any{"$ref": "#/components/schemas/" + schema},
		},
	}
}

func jsonArray(schema string) map[string]any {
	return map[string]any{
		"application/json": map[string]any{
			"schema": map[string]any{
				"type":  "array",
				"items": map[string]any{"$ref": "#/components/schemas/" + schema},
			},
		},
	}
}

func jsonBody(schema string) map[string]any {
	return map[string]any{"required": true, "content": jsonRef(schema)}
}

func pathParam(name string) map[string]any {
	return map[string]any{"name": name, "in": "path", "required": true, "schema": map[string]any{"type": "string"}}
}
