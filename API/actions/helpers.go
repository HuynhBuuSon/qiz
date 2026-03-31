package actions

import "github.com/gofrs/uuid"

// mustUUID parses a UUID string, returning a zero UUID on error.
func mustUUID(s string) uuid.UUID {
	id, err := uuid.FromString(s)
	if err != nil {
		return uuid.UUID{}
	}
	return id
}
