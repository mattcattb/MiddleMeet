package httpapi

import (
	"encoding/json"
	"middle-meetup-server/internal/geo"
	"middle-meetup-server/internal/meeting"
	"net/http"
)

type MeetingRequest struct {
	Participants []meeting.Participant `json:"participants"`
	Destination  geo.Location          `json:"destination"`
}

func (app *Application) EstimateMeetingHandler(w http.ResponseWriter, r *http.Request) {
	req, ok := decodeMeetingRequest(w, r)
	if !ok {
		return
	}

	resp, err := app.MeetingPlanner.EstimateMeeting(req.Participants, req.Destination)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "estimate_failed", "Meeting estimate failed", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func (app *Application) MeetingRoutesHandler(w http.ResponseWriter, r *http.Request) {
	req, ok := decodeMeetingRequest(w, r)
	if !ok {
		return
	}

	resp, err := app.MeetingPlanner.BuildMeetingRoutes(req.Participants, req.Destination)
	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "routes_failed", "Meeting routes failed", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func decodeMeetingRequest(w http.ResponseWriter, r *http.Request) (MeetingRequest, bool) {
	var req MeetingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid_json", "Invalid json for request", err.Error())
		return MeetingRequest{}, false
	}

	if len(req.Participants) == 0 {
		writeJSONError(w, http.StatusBadRequest, "missing_participants", "At least one participant is required", "")
		return MeetingRequest{}, false
	}

	return req, true
}
