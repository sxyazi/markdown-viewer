package main

type File struct {
	Name      string `json:"name"`
	Path      string `json:"path"`
	Size      int64  `json:"size"`
	Exists    bool   `json:"exists"`
	UpdatedAt int64  `json:"updated_at"`
}
