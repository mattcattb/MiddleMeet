package httpapi

import (
	"encoding/json"
	"middle-meetup-server/internal/geo"
	"middle-meetup-server/internal/location"
	"middle-meetup-server/internal/meeting"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestServerHealth(t *testing.T) {
	rec := httptest.NewRecorder()
	newTestServer().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/health", nil))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusOK)
	}

	var body map[string]any
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["ok"] != true {
		t.Fatalf("ok = %v, want true", body["ok"])
	}
}

func TestServerAllowsConfiguredCORSOrigin(t *testing.T) {
	req := httptest.NewRequest(http.MethodOptions, "/api/meeting/estimate", nil)
	req.Header.Set("Origin", "https://app.example.com")
	rec := httptest.NewRecorder()

	newTestServer().ServeHTTP(rec, req)

	if rec.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNoContent)
	}
	if got := rec.Header().Get("Access-Control-Allow-Origin"); got != "https://app.example.com" {
		t.Fatalf("Access-Control-Allow-Origin = %q, want configured origin", got)
	}
}

func TestEstimateMeetingHandler(t *testing.T) {
	body := `{
		"participants": [
			{"name":"A","location":{"name":"A","coord":{"lat":0,"lng":0}}},
			{"name":"B","location":{"name":"B","coord":{"lat":0,"lng":2}}}
		],
		"destination": {"name":"Cafe","coord":{"lat":0,"lng":1}}
	}`

	rec := httptest.NewRecorder()
	newTestServer().ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/meeting/estimate", strings.NewReader(body)))

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d: %s", rec.Code, http.StatusOK, rec.Body.String())
	}

	var resp meeting.MeetingEstimate
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.AverageDurationSeconds != 1000 || resp.MaxDurationSeconds != 1000 {
		t.Fatalf("estimate = %+v, want balanced 1000 second estimate", resp)
	}
}

func TestEstimateMeetingHandlerRejectsMissingParticipants(t *testing.T) {
	rec := httptest.NewRecorder()
	newTestServer().ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/api/meeting/estimate", strings.NewReader(`{"participants":[]}`)))

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	var resp demoErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Code != "missing_participants" {
		t.Fatalf("error code = %q, want missing_participants", resp.Code)
	}
}

func TestSearchLocationsHandlerValidatesCoordinates(t *testing.T) {
	rec := httptest.NewRecorder()
	newTestServer().ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/locations/search?query=cafe&lat=bad&lng=1", nil))

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	var resp demoErrorResponse
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatal(err)
	}
	if resp.Code != "invalid_lat" {
		t.Fatalf("error code = %q, want invalid_lat", resp.Code)
	}
}

func newTestServer() http.Handler {
	fakeMaps := fakeMaps{}

	return NewServer(Application{
		Config: Config{
			CORSOrigins: []string{"https://app.example.com"},
		},
		MeetingPlanner: meeting.NewPlanner(fakeMaps, fakeMaps, fakeMaps),
		Locations:      location.NewService(fakeMaps),
	})
}

type fakeMaps struct{}

func (fakeMaps) EstimateRoute(from geo.Location, to geo.Location) (meeting.RouteEstimate, error) {
	cost := routeCost(from, to)
	return meeting.RouteEstimate{
		From:            from,
		To:              to,
		DistanceMeters:  cost,
		DurationSeconds: cost,
	}, nil
}

func (fakeMaps) EstimateRouteMatrix(origins []geo.Location, destinations []geo.Location) (meeting.RouteMatrix, error) {
	durations := make([][]int, 0, len(origins))
	distances := make([][]int, 0, len(origins))

	for _, origin := range origins {
		durationRow := make([]int, 0, len(destinations))
		distanceRow := make([]int, 0, len(destinations))
		for _, destination := range destinations {
			cost := routeCost(origin, destination)
			durationRow = append(durationRow, cost)
			distanceRow = append(distanceRow, cost)
		}
		durations = append(durations, durationRow)
		distances = append(distances, distanceRow)
	}

	return meeting.RouteMatrix{
		DurationSeconds: durations,
		DistanceMeters:  distances,
	}, nil
}

func (fakeMaps) BuildIsochrone(geo.Location, int) (geo.Polygon, error) {
	return geo.Polygon{}, nil
}

func (fakeMaps) SearchPlaces(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {
	return []geo.Location{{
		Name: query,
		Coord: geo.Coord{
			Lat: near.Lat,
			Lng: near.Lng,
		},
	}}, nil
}

func (fakeMaps) GeocodeSearch(query string, near geo.Coord, radiusMeters int) ([]geo.Location, error) {
	return []geo.Location{{Name: query, Coord: near}}, nil
}

func (fakeMaps) GeocodeAutocomplete(query string, near geo.Coord) ([]geo.Location, error) {
	return []geo.Location{{Name: query, Coord: near}}, nil
}

func (fakeMaps) ReverseGeocode(coord geo.Coord) (geo.Location, error) {
	return geo.Location{Name: "Reverse geocode", Coord: coord}, nil
}

func routeCost(from geo.Location, to geo.Location) int {
	latDelta := from.Coord.Lat - to.Coord.Lat
	if latDelta < 0 {
		latDelta = -latDelta
	}

	lngDelta := from.Coord.Lng - to.Coord.Lng
	if lngDelta < 0 {
		lngDelta = -lngDelta
	}

	return int((latDelta + lngDelta) * 1000)
}
