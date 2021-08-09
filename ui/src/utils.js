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
    var $element = $(element);
    var elementTop = $element.offset().top;
    var elementBottom = elementTop + $element.outerHeight();

    var viewportTop = $(window).scrollTop();
    var viewportBottom = viewportTop + $(window).height();
    return elementBottom > viewportTop && elementTop < viewportBottom;
}

export {respondToVisible, cancelToRespond}
