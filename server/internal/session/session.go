package session

import (
	"middle-meetup-server/internal/meeting"
	"time"
)

type Session struct {
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ParticipantsSate struct {
	Participants []meeting.Participant `json:"participants"`
	UpdatedAt    time.Time
}
