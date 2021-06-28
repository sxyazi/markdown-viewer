package main

import (
	"io/ioutil"
)

func (m *meta) Test(name string) (ret bool, e error) {
	bytes, e := ioutil.ReadFile(name)
	if e != nil {
		return
	}

	cursor := 0
	lastBlank, lastTrigger := 0, 0
	leadTrigger, tailTrigger := 0, 0

	for _, b := range bytes {
		prev := cursor
		cursor++

		if b == '-' {
			if leadTrigger < 3 && (prev == lastTrigger || leadTrigger == 0) {
				leadTrigger++
				lastTrigger = cursor
			} else if tailTrigger < 3 && (prev == lastTrigger || (tailTrigger == 0 && prev == lastBlank)) {
				tailTrigger++
				lastTrigger = cursor
			}

			continue
		} else if b == '\n' || b == '\r' {
			lastBlank = cursor
			if prev != lastTrigger {
				continue
			}

			if leadTrigger == 3 {
				leadTrigger++
			} else {
				tailTrigger++
			}
		} else {
			continue
		}

		if leadTrigger > 3 && tailTrigger > 3 {
			ret = true
			return
		}
	}

	return
}

func (m *meta) Parse() {

}
