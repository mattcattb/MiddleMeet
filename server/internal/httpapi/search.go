package httpapi

import (
	"middle-meetup-server/internal/geo"
	"net/http"
	"strconv"
)

func (app *Application) SearchLocationsHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	text := query.Get("query")
	near, ok := coordFromQuery(w, query.Get("lat"), query.Get("lng"))
	if !ok {
		return
	}

	radiusMeters := 10000
	if rawRadius := query.Get("radiusMeters"); rawRadius != "" {
		parsedRadius, err := strconv.Atoi(rawRadius)
		if err != nil {
			writeJSONError(w, http.StatusBadRequest, "invalid_radius", "Invalid radiusMeters query parameter", err.Error())
			return
		}
		radiusMeters = parsedRadius
	}

	locations, err := app.Locations.GeocodeSearch(text, near, radiusMeters)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "location_search_failed", "Location search failed", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, locations)
}

func (app *Application) AutocompleteLocationsHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	text := query.Get("query")
	near, ok := coordFromQuery(w, query.Get("lat"), query.Get("lng"))
	if !ok {
		return
	}

	locations, err := app.Locations.GeocodeAutocomplete(text, near)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "location_autocomplete_failed", "Location autocomplete failed", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, locations)
}

func (app *Application) ReverseGeocodeHandler(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	coord, ok := coordFromQuery(w, query.Get("lat"), query.Get("lng"))
	if !ok {
		return
	}

	location, err := app.Locations.ReverseGeocode(coord)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "reverse_geocode_failed", "Reverse geocode failed", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, location)
}

func coordFromQuery(w http.ResponseWriter, rawLat string, rawLng string) (geo.Coord, bool) {
	lat, err := strconv.ParseFloat(rawLat, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid_lat", "Invalid lat query parameter", err.Error())
		return geo.Coord{}, false
	}

	lng, err := strconv.ParseFloat(rawLng, 64)
	if err != nil {
		writeJSONError(w, http.StatusBadRequest, "invalid_lng", "Invalid lng query parameter", err.Error())
		return geo.Coord{}, false
	}

	return geo.Coord{Lat: lat, Lng: lng}, true
}
