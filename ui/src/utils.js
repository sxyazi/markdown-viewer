import $ from 'jquery'

var callback
var observer = new IntersectionObserver(function (entries, observer) {
    entries.forEach(function (entry) {
        if (entry.intersectionRatio > 0) {
            setTimeout(function () {
                isInViewport(entry.target) && callback(entry.target)
            }, 100)
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

function isInViewport(element) {
    var $element = $(element)
    var elementTop = $element.offset().top
    var elementBottom = elementTop + $element.outerHeight()

    var viewportTop = $(window).scrollTop()
    var viewportBottom = viewportTop + $(window).height()
    return elementBottom > viewportTop && elementTop < viewportBottom
}

function selectionText() {
    var text = ''
    if (window.getSelection) {
        text = window.getSelection().toString()
    } else if (document.selection && document.selection.type !== 'Control') {
        text = document.selection.createRange().text
    }
    return text
}

function copyElementText(element) {
    var range, selection
    if (document.body.createTextRange) {
        range = document.body.createTextRange()
        range.moveToElementText(element)
        range.select()
    } else if (window.getSelection) {
        selection = window.getSelection()
        range = document.createRange()
        range.selectNodeContents(element)
        selection.removeAllRanges()
        selection.addRange(range)
    }

    try {
        document.execCommand('copy', false, null)
    } catch {
        return false
    }

    return true
}

export {respondToVisible, cancelToRespond, selectionText, copyElementText}
