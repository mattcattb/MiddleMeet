package maps

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"map-go-server/internal/geo"
	"map-go-server/internal/meeting"
	"net/http"
	"time"
)

type OpenRouteClient struct {
	ApiKey string
	client *http.Client
}

var openRouteUrl = "https://api.openrouteservice.org/v2/directions/driving-car"

type directionsRequest struct {
	Coordinates [][]float64 `json:"coordinates"`
}

type directionsResponse struct {
	Routes []struct {
		Summary struct {
			Distance float64 `json:"distance"`
			Duration float64 `json:"duration"`
		} `json:"summary"`

		Segments []struct {
			Distance float64 `json:"distance"`
			Duration float64 `json:"duration"`

			Steps []struct {
				Distance    float64 `json:"distance"`
				Duration    float64 `json:"duration"`
				Instruction string  `json:"instruction"`
				Name        string  `json:"name"`
			} `json:"steps"`
		} `json:"segments"`

		Geometry string `json:"geometry"`
	} `json:"routes"`
}

func NewClient(apiKey string) *OpenRouteClient {
	return &OpenRouteClient{
		ApiKey: apiKey,
		client: &http.Client{Timeout: 10 * time.Second},
	}
}

func (or *OpenRouteClient) fetchDistance(coords []geo.Coord) (dirResp directionsResponse, err error) {

	var reqChords = [][]float64{}

	for _, coord := range coords {
		reqChords = append(reqChords, []float64{coord.Lng, coord.Lat})
	}

	reqBody := directionsRequest{
		Coordinates: reqChords,
	}

	jsonBytes, err := json.Marshal(reqBody)

	if err != nil {
		return dirResp, err
	}

	req, err := http.NewRequest(http.MethodPost, openRouteUrl, bytes.NewBuffer(jsonBytes))

	if err != nil {
		return dirResp, err
	}

	req.Header.Add("Accept", "application/json, application/geo+json, application/gpx+xm, img/png; charset=utf-8")
	req.Header.Add("Authorization", or.ApiKey)
	req.Header.Add("Content-Type", "application/json; charset=utf-8")

	resp, err := or.client.Do(req)

	if err != nil {
		return dirResp, err
	}

	defer resp.Body.Close()
	resp_body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return dirResp, fmt.Errorf("openroute request failed: status %d: %s", resp.StatusCode, string(resp_body))
	}

	err = json.Unmarshal(resp_body, &dirResp)
	if err != nil {
		return dirResp, err
	}

	return dirResp, nil
}

func (or *OpenRouteClient) EstimateRoute(from geo.Location, to geo.Location) (est meeting.RouteEstimate, err error) {

	resp, err := or.fetchDistance([]geo.Coord{from.Coord, to.Coord})

	if err != nil {
		return est, err
	}

	if len(resp.Routes) == 0 {
		return est, fmt.Errorf("openroute returned no routes")
	}

	// todo find shortest route of given selection of routes
	var firstRoute = resp.Routes[0]

	est.DistanceMeters = int(firstRoute.Summary.Distance)
	est.DurationSeconds = int(firstRoute.Summary.Duration)
	est.From = from
	est.To = to

	return est, nil

}

func (or *OpenRouteClient) queryDistances() {

}
