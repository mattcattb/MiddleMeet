package meeting

type CompareOptions struct {
	MaxDurationSeconds           int    `json:"maxDurationSeconds"`
	MaxDurationDifferenceSeconds int    `json:"maxDurationDifferenceSeconds"`
	SortBy                       string `json:"sortBy"`
}
