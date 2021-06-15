package main

import (
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
	"strings"
)

func getFiles(parent string) (files []*File) {
	filepath.Walk(parent, func(path string, info fs.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if isIgnored(path) {
			return nil
		}

		if strings.HasSuffix(strings.ToLower(info.Name()), ".md") {
			files = append(files, &File{
				Name:      info.Name(),
				Path:      path,
				Size:      info.Size(),
				Exists:    true,
				UpdatedAt: info.ModTime().UnixNano(),
			})
		}

		return nil
	})

	return
}

func getArgument() string {
	if len(os.Args) < 2 {
		panic("Please pass at least one parameter")
	}

	return os.Args[1]
}

func isIgnored(path string) bool {
	path = strings.ReplaceAll(path, "\\", "/")

	if strings.Contains(path, "/node_modules/") {
		return true
	}

	if strings.Contains(path, "/vendor/") && fileExistsDeep(path, "vendor", "autoload.php") {
		return true
	}

	return false
}

func wrapSlash(path string) string {
	return "/" + strings.Trim(path, "/") + "/"
}

func jsonEncode(value interface{}) string {
	result, err := json.Marshal(value)
	if err != nil {
		return ""
	}

	return string(result)
}

func fileExistsDeep(root string, directory string, filename string) bool {
	directory = wrapSlash(directory)
	parts := strings.Split(wrapSlash(root), directory)

	lastIndex := len(parts) - 1
	if strings.Contains(wrapSlash(parts[lastIndex]), directory) {
		parts[lastIndex] = ""
	} else {
		parts = parts[:lastIndex]
	}

	lead := ""
	for _, part := range parts {
		lead += part + directory
		lead = strings.ReplaceAll(lead, "//", "/")

		if _, err := os.Stat(lead + filename); err == nil {
			return true
		}
	}

	return false
}
