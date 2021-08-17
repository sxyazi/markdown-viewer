import $ from 'jquery'
import katex from 'katex'
import Store from '@/store'
import {
    apiEndpoint,
    cancelToRespond,
    copyElementText,
    debounce,
    respondToVisible,
    scrollTo,
    selectionText
} from '@/utils'

const adjustHeading = debounce(() => {
    if (!Store.readjust) return

    Store.readjust = false
    if (Store.currentHeading.length)
        scrollTo($('#content'), Store.currentHeading.get(0).offsetTop, 50)
}, 50)

function atBottom() {
    const $content = $('#content').get(0)
    // The height of the element viewport, without last screen
    const lastScrollHeight = $content.scrollHeight - $content.offsetHeight

    // Is it at the bottom of page
    if (Math.abs($content.scrollTop - lastScrollHeight) < 3) {
        return true
    }

    // Is located in the last screen
    if (Store.currentHeading.length) {
        return $content.scrollTop + Store.currentHeading.offset().top > lastScrollHeight
    }

    return false
}

function renderAsync() {
    const callback = element => {
        (element.tagName.toLowerCase() === 'img' ? renderImage : renderMath)(element)
    }

    for (let i = 0, elems = $('#content img'); i < elems.length; i++) {
        elems[i].setAttribute('data-src', elems[i].getAttribute('src'));
        elems[i].removeAttribute('src');
        respondToVisible(elems[i], callback)
    }
    for (let i = 0, elems = $('#content .math'); i < elems.length; i++) {
        respondToVisible(elems[i], callback)
    }
}

function renderImage(element) {
    cancelToRespond(element)
    if (!element.hasAttribute('data-src')) {
        return
    }

    element.setAttribute('src', element.getAttribute('data-src'))
    element.removeAttribute('data-src')
    adjustHeading()
}

function renderMath(element) {
    cancelToRespond(element)
    if (element.classList.contains('rendered')) {
        return
    } else {
        element.classList.add('rendered')
    }

    const text = element.innerText
    if (Store.mathElements[text]) {
        return $(element).replaceWith(Store.mathElements[text].cloneNode(true))
    }

    let math
    const displayMode = element.classList.contains('display')
    if (displayMode) {
        math = text.substr(2, text.length - 5)
    } else {
        math = text.substr(2, text.length - 4)
    }

    katex.render(math, element, {
        output: 'html',
        throwOnError: false,
        displayMode: displayMode,
    })
    adjustHeading()

    Store.mathElements[text] = element.cloneNode(true)
}

$('#content').on('click', '.heading-anchor', function () {
    const $content = $('#content')
    Store.currentHeading = $(this).parent()
    scrollTo($content, Store.currentHeading.get(0).offsetTop)

    const hash = '#' + decodeURIComponent($(this).parent().attr('id'))
    if (location.hash !== hash)
        location.hash = hash

    return false
})

$('#content').on('dblclick', 'pre', function () {
    if (selectionText() === '\n') {
        return !copyElementText(this)
    }
})

$('#content').scroll(debounce(() => {
    if (!Store.scrolling) {
        Store.readjust = false
    }

    const $headings = $('#content .heading')
    for (let i = $headings.length - 1; i >= 0; i--) {
        const $heading = $headings.eq(i)
        if ($heading.position().top <= 0) {
            Store.currentHeading = $heading
            history.pushState(null, '', Store.currentFile.path + '#' + Store.currentHeading.attr('id'))
            break
        }
    }

    if (atBottom()) {
        Store.currentHeading = $headings.last()
        const id = Store.currentHeading.attr('id')
        return id && history.pushState(null, '', Store.currentFile.path + '#' + id)
    }
}, 300))

setTimeout(function watcher() {
    if (!Store.currentFile.path) {
        return setTimeout(watcher, 1000)
    }

    $.post(apiEndpoint('stat'), {
        path: Store.currentFile.path
    }).done(function (stat) {
        try {
            stat = JSON.parse(stat)
        } catch (e) {
            stat = {}
        }

        if (stat.updated_at <= Store.currentFile.updated_at) {
            return setTimeout(watcher, 500)
        }

        Store.open(Store.currentFile.path, () => {
            Store.currentFile.updated_at = stat.updated_at
            setTimeout(watcher, 500)
        })
    }).fail(() => setTimeout(watcher, 1000))
}, 500)

export default {adjustHeading, renderAsync}
