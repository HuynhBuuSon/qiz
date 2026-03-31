package actions

import (
	"fmt"
	"net/http"

	"github.com/canhan/qiz-api/models"
	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

// PlayersListHandler returns a list of players.
func PlayersListHandler(c buffalo.Context) error {
	players := &models.Players{}

	if err := models.DB.All(players); err != nil {
		return err
	}

	return c.Render(http.StatusOK, r.JSON(players))
}

// PlayersCreateHandler creates a new player (join/register).
func PlayersCreateHandler(c buffalo.Context) error {
	player := &models.Player{}

	if err := c.Bind(player); err != nil {
		return err
	}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	verrs, err := tx.ValidateAndCreate(player)
	if err != nil {
		return err
	}

	if verrs.HasAny() {
		return c.Render(http.StatusUnprocessableEntity, r.JSON(verrs))
	}

	// Broadcast player joined to the room
	BroadcastToRoom(player.RoomID.String(), WSMessage{
		Type:    "player_joined",
		Payload: player,
	})

	return c.Render(http.StatusCreated, r.JSON(player))
}

// PlayersShowHandler returns a single player.
func PlayersShowHandler(c buffalo.Context) error {
	player := &models.Player{}

	if err := models.DB.Find(player, c.Param("player_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	return c.Render(http.StatusOK, r.JSON(player))
}
