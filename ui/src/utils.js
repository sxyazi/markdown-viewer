var callback
var observer = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
        if (entry.intersectionRatio > 0) {
            callback(entry.target)
        }
    })
}, {
    root: document.documentElement
})

function respondToVisible(element, call) {
    callback = call
    observer.observe(element)
}

function cancelToRespond(element) {
    observer.unobserve(element)
}

export {respondToVisible, cancelToRespond}
