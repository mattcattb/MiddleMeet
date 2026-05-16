package geo

type Coord struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

type Location struct {
	Name    string `json:"name"`
	Address string `json:"address"`
	Coord   Coord  `json:"coord"`
}

type BBox struct {
	MinLat float64 `json:"minLat"`
	MinLng float64 `json:"minLng"`
	MaxLat float64 `json:"maxLat"`
	MaxLng float64 `json:"maxLng"`
}

type Polygon struct {
	Type        string        `json:"type"`        // "Polygon"
	Coordinates [][][]float64 `json:"coordinates"` // GeoJSON lon/lat order
}

type RouteGeometry struct {
	Polyline string  `json:"polyline,omitempty"`
	Points   []Coord `json:"points,omitempty"`
}

type RouteStep struct {
	Instruction     string `json:"instruction"`
	Name            string `json:"name,omitempty"`
	DistanceMeters  int    `json:"distanceMeters"`
	DurationSeconds int    `json:"durationSeconds"`
	Type            int    `json:"type,omitempty"`
	WayPoints       []int  `json:"wayPoints,omitempty"`
	Start           *Coord `json:"start,omitempty"`
	End             *Coord `json:"end,omitempty"`
}
