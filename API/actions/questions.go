package actions

import (
	"fmt"
	"net/http"

	"github.com/canhan/qiz-api/models"
	"github.com/gobuffalo/buffalo"
	"github.com/gobuffalo/pop/v6"
)

// QuestionsListHandler returns a list of questions.
func QuestionsListHandler(c buffalo.Context) error {
	questions := &models.Questions{}

	if err := models.DB.All(questions); err != nil {
		return err
	}

	return c.Render(http.StatusOK, r.JSON(questions))
}

// QuestionsCreateHandler creates a new question.
func QuestionsCreateHandler(c buffalo.Context) error {
	question := &models.Question{}

	if err := c.Bind(question); err != nil {
		return err
	}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	verrs, err := tx.ValidateAndCreate(question)
	if err != nil {
		return err
	}

	if verrs.HasAny() {
		return c.Render(http.StatusUnprocessableEntity, r.JSON(verrs))
	}

	return c.Render(http.StatusCreated, r.JSON(question))
}

// QuestionsShowHandler returns a single question.
func QuestionsShowHandler(c buffalo.Context) error {
	question := &models.Question{}

	if err := models.DB.Find(question, c.Param("question_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	return c.Render(http.StatusOK, r.JSON(question))
}

// QuestionsUpdateHandler updates an existing question.
func QuestionsUpdateHandler(c buffalo.Context) error {
	question := &models.Question{}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	if err := tx.Find(question, c.Param("question_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	if err := c.Bind(question); err != nil {
		return err
	}

	verrs, err := tx.ValidateAndSave(question)
	if err != nil {
		return err
	}

	if verrs.HasAny() {
		return c.Render(http.StatusUnprocessableEntity, r.JSON(verrs))
	}

	return c.Render(http.StatusOK, r.JSON(question))
}

// QuestionsDeleteHandler deletes a question.
func QuestionsDeleteHandler(c buffalo.Context) error {
	question := &models.Question{}

	tx, ok := c.Value("tx").(*pop.Connection)
	if !ok {
		return c.Error(http.StatusInternalServerError, fmt.Errorf("no transaction found"))
	}

	if err := tx.Find(question, c.Param("question_id")); err != nil {
		return c.Error(http.StatusNotFound, err)
	}

	if err := tx.Destroy(question); err != nil {
		return err
	}

	return c.Render(http.StatusOK, r.JSON(map[string]string{"message": "question deleted"}))
}
