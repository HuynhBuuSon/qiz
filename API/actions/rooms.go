package actions

import (
	"fmt"
	"net/http"

	"github.com/canhan/qiz-api/models"
	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

// RoomsListHandler returns a list of rooms.
func RoomsListHandler(c buffalo.Context) error {
	rooms := &models.Rooms{}

	q := models.DB.Q()

	if err := q.All(rooms); err != nil {
		return err
	}

	return c.Render(http.StatusOK, r.JSON(rooms))
}

// RoomsCreateHandler creates a new room.
func RoomsCreateHandler(c buffalo.Context) error {
	room := &models.Room{}

	if err := c.Bind(room); err != nil {
		return err
	}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	verrs, err := tx.ValidateAndCreate(room)
	if err != nil {
		return err
	}

	if verrs.HasAny() {
		return c.Render(http.StatusUnprocessableEntity, r.JSON(verrs))
	}

	return c.Render(http.StatusCreated, r.JSON(room))
}

// RoomsShowHandler returns a single room.
func RoomsShowHandler(c buffalo.Context) error {
	room := &models.Room{}

	if err := models.DB.Find(room, c.Param("room_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	return c.Render(http.StatusOK, r.JSON(room))
}

// RoomsUpdateHandler updates an existing room.
func RoomsUpdateHandler(c buffalo.Context) error {
	room := &models.Room{}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	if err := tx.Find(room, c.Param("room_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	if err := c.Bind(room); err != nil {
		return err
	}

	verrs, err := tx.ValidateAndSave(room)
	if err != nil {
		return err
	}

	if verrs.HasAny() {
		return c.Render(http.StatusUnprocessableEntity, r.JSON(verrs))
	}

	return c.Render(http.StatusOK, r.JSON(room))
}

// RoomsDeleteHandler deletes a room.
func RoomsDeleteHandler(c buffalo.Context) error {
	room := &models.Room{}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	if err := tx.Find(room, c.Param("room_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	if err := tx.Destroy(room); err != nil {
		return err
	}

	return c.Render(http.StatusOK, r.JSON(map[string]string{"message": "room deleted"}))
}
