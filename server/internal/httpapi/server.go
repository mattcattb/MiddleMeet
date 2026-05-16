package httpapi

import (
	"encoding/json"
	"middle-meetup-server/internal/location"
	"middle-meetup-server/internal/meeting"
	"net/http"
	"strings"
)

type Config struct {
	Port            string
	OpenRouteAPIKey string
}

type Application struct {
	Config         Config
	MeetingPlanner *meeting.Planner
	Locations      *location.Service
}

func NewServer(app Application) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", health)

	mux.HandleFunc("POST /api/meeting/estimate", app.EstimateMeetingHandler)
	mux.HandleFunc("POST /api/meeting/routes", app.MeetingRoutesHandler)
	mux.HandleFunc("POST /api/meeting/area", app.MeetingAreaHandler)
	mux.HandleFunc("POST /api/meeting/destinations/search", app.SearchMeetingDestinationsHandler)

	mux.HandleFunc("GET /api/locations/search", app.SearchLocationsHandler)
	mux.HandleFunc("GET /api/locations/autocomplete", app.AutocompleteLocationsHandler)
	mux.HandleFunc("GET /api/locations/reverse", app.ReverseGeocodeHandler)

	return withCORS(mux)
}

func health(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"ok":      true,
		"message": "Go API is running",
	})
}

func writeJSON(w http.ResponseWriter, status int, value any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(value)
}

type demoErrorResponse struct {
	Error   string `json:"error"`
	Code    string `json:"code"`
	Details string `json:"details"`
}

func writeJSONError(w http.ResponseWriter, status int, code string, message string, details string) {
	writeJSON(w, status, demoErrorResponse{
		Error:   message,
		Code:    code,
		Details: details,
	})
}

func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if isAllowedDevOrigin(r.Header.Get("Origin")) {
			w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
			w.Header().Set("Vary", "Origin")
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func isAllowedDevOrigin(origin string) bool {
	return strings.HasPrefix(origin, "http://localhost:") || strings.HasPrefix(origin, "http://127.0.0.1:")
}
