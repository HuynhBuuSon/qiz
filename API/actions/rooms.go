package actions

import (
	"net/http"
	"strings"

	"github.com/canhan/qiz-api/models"
	"github.com/gobuffalo/buffalo"
)

// RoomsListHandler GET /api/rooms
func RoomsListHandler(c buffalo.Context) error {
	var rooms []models.GameRoom
	if err := models.SQL.Select(&rooms, `SELECT * FROM game_rooms ORDER BY created_at DESC`); err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	return c.Render(http.StatusOK, r.JSON(rooms))
}

// RoomsCreateHandler POST /api/rooms
func RoomsCreateHandler(c buffalo.Context) error {
	var body struct {
		Name             string `json:"name"`
		MainColor        string `json:"mainColor"`
		ColorFrom        string `json:"colorFrom"`
		ColorTo          string `json:"colorTo"`
		MaxPlayers       int    `json:"maxPlayers"`
		PointMode        string `json:"pointMode"`
		PointFrom        int    `json:"pointFrom"`
		PointTo          int    `json:"pointTo"`
		CreatedBy        string `json:"createdBy"`
		JoinCode         string `json:"join_code"`
		PresentationCode string `json:"presentation_code"`
	}
	if err := c.Bind(&body); err != nil {
		return c.Error(http.StatusBadRequest, err)
	}

	joinCode := body.JoinCode
	if joinCode == "" {
		joinCode = generateCode(6)
	}
	presCode := body.PresentationCode
	if presCode == "" {
		presCode = generateCode(6)
	}

	roomNumber, err := generateRoomNumber()
	if err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}

	var room models.GameRoom
	err = models.SQL.QueryRowx(
		`INSERT INTO game_rooms
		   (name, room_number, join_code, presentation_code,
		    main_color, color_from, color_to,
		    max_players, point_mode, point_from, point_to, created_by)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		 RETURNING *`,
		body.Name, roomNumber, joinCode, presCode,
		body.MainColor, body.ColorFrom, body.ColorTo,
		body.MaxPlayers, body.PointMode, body.PointFrom, body.PointTo, body.CreatedBy,
	).StructScan(&room)
	if err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	return c.Render(http.StatusOK, r.JSON(room))
}

// RoomsShowHandler GET /api/rooms/{room_id}
func RoomsShowHandler(c buffalo.Context) error {
	var room models.GameRoom
	if err := models.SQL.Get(&room, `SELECT * FROM game_rooms WHERE id = $1`, c.Param("room_id")); err != nil {
		return c.Error(http.StatusNotFound, errNotFound("room"))
	}
	return c.Render(http.StatusOK, r.JSON(room))
}

// RoomsPatchHandler PATCH /api/rooms/{room_id}
func RoomsPatchHandler(c buffalo.Context) error {
	var body struct {
		MainColor *string `json:"mainColor"`
		ColorFrom *string `json:"colorFrom"`
		ColorTo   *string `json:"colorTo"`
	}
	if err := c.Bind(&body); err != nil {
		return c.Error(http.StatusBadRequest, err)
	}

	roomID := c.Param("room_id")

	// Ensure room exists
	var exists bool
	if err := models.SQL.Get(&exists, `SELECT EXISTS(SELECT 1 FROM game_rooms WHERE id=$1)`, roomID); err != nil || !exists {
		return c.Error(http.StatusNotFound, errNotFound("room"))
	}

	parts := []string{}
	args := []any{}
	idx := 1
	if body.MainColor != nil {
		parts = append(parts, field("main_color", &idx))
		args = append(args, *body.MainColor)
	}
	if body.ColorFrom != nil {
		parts = append(parts, field("color_from", &idx))
		args = append(args, *body.ColorFrom)
	}
	if body.ColorTo != nil {
		parts = append(parts, field("color_to", &idx))
		args = append(args, *body.ColorTo)
	}
	if len(parts) == 0 {
		return c.Error(http.StatusBadRequest, errMsg("no fields to update"))
	}
	args = append(args, roomID)

	var room models.GameRoom
	err := models.SQL.QueryRowx(
		`UPDATE game_rooms SET `+strings.Join(parts, ", ")+
			` WHERE id = $`+itoa(idx)+` RETURNING *`,
		args...,
	).StructScan(&room)
	if err != nil {
		return c.Error(http.StatusInternalServerError, err)
	}
	return c.Render(http.StatusOK, r.JSON(room))
}

// --- helpers ----------------------------------------------------------------

func generateRoomNumber() (int, error) {
	for i := 0; i < 100; i++ {
		n := 1000 + randIntn(9000)
		var exists bool
		if err := models.SQL.Get(&exists, `SELECT EXISTS(SELECT 1 FROM game_rooms WHERE room_number=$1)`, n); err != nil {
			return 0, err
		}
		if !exists {
			return n, nil
		}
	}
	return 0, errMsg("failed to generate unique room number")
}
