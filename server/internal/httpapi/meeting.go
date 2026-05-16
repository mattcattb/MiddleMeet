package httpapi

import (
	"encoding/json"
	"middle-meetup-server/internal/geo"
	"net/http"
)

type PreviewTripRequest struct {
	LocationA     geo.Location   `json:"locationA"`
	LocationB     geo.Location   `json:"locationB"`
	InterestAreas []geo.Location `json:"interestAreas"`
}

func (app *Application) CompareMeetingOptionsHandler(w http.ResponseWriter, r *http.Request) {
	var previewRequest PreviewTripRequest
	err := json.NewDecoder(r.Body).Decode(&previewRequest)

	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid_json", "Invalid json for request", err.Error())
		return
	}

	resp, err := app.MeetingPlanner.CompareDestinations(previewRequest.LocationA, previewRequest.LocationB, previewRequest.InterestAreas)

	if err != nil {
		writeJSONError(w, http.StatusInternalServerError, "internal_error", "Internal server failed...", err.Error())
		return
	}

	writeJSON(w, 200, resp)
}

func (app *Application) FindMeetupLocationsHandler(w http.ResponseWriter, r *http.Request) {

}
