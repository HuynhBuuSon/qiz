package actions

import (
	"encoding/json"
	"net/http"
	"sync"

	"github.com/gobuffalo/buffalo"
	"github.com/gorilla/websocket"
)

// WSMessage is the structure for WebSocket messages.
type WSMessage struct {
	Type    string `json:"type"`
	Payload any    `json:"payload"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// In production, validate the origin against allowed origins
		return true
	},
}

// hub manages active WebSocket connections grouped by room ID.
var hub = &connectionHub{
	rooms: make(map[string]map[*websocket.Conn]bool),
}

type connectionHub struct {
	mu    sync.RWMutex
	rooms map[string]map[*websocket.Conn]bool
}

func (h *connectionHub) register(roomID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, ok := h.rooms[roomID]; !ok {
		h.rooms[roomID] = make(map[*websocket.Conn]bool)
	}
	h.rooms[roomID][conn] = true
}

func (h *connectionHub) unregister(roomID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if conns, ok := h.rooms[roomID]; ok {
		delete(conns, conn)
		if len(conns) == 0 {
			delete(h.rooms, roomID)
		}
	}
}

func (h *connectionHub) broadcast(roomID string, msg WSMessage) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	data, err := json.Marshal(msg)
	if err != nil {
		return
	}

	for conn := range h.rooms[roomID] {
		_ = conn.WriteMessage(websocket.TextMessage, data)
	}
}

// BroadcastToRoom sends a message to all clients in a room.
func BroadcastToRoom(roomID string, msg WSMessage) {
	hub.broadcast(roomID, msg)
}

// WebSocketHandler upgrades HTTP connections to WebSocket.
// Query params: room_id (required), player_id (optional)
func WebSocketHandler(c buffalo.Context) error {
	roomID := c.Param("room_id")
	if roomID == "" {
		return c.Error(http.StatusBadRequest, nil)
	}

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}
	defer conn.Close()

	hub.register(roomID, conn)
	defer hub.unregister(roomID, conn)

	// Send welcome message
	_ = conn.WriteJSON(WSMessage{
		Type:    "connected",
		Payload: map[string]string{"room_id": roomID},
	})

	// Read loop — keep connection alive, handle client messages
	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			break
		}

		var msg WSMessage
		if err := json.Unmarshal(data, &msg); err != nil {
			continue
		}

		// Echo/relay messages within the room as needed
		hub.broadcast(roomID, msg)
	}

	return nil
}
