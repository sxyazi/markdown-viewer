import $ from 'jquery'
import katex from 'katex/dist/katex'
import {cancelToRespond, respondToVisible} from './utils'

var allFiles = {}
var currentFile = {}
var mathElements = {}
var fileTemplate = $('#file-template').html()

function open(path, done) {
    if (!allFiles.list) {
        return done(false)
    }

    var file = null
    var isSwitch = false
    for (var i = 0; i < allFiles.list.length; i++) {
        if (path === allFiles.list[i].path) {
            file = allFiles.list[i]
            break
        }
    }

    if (!file) {
        return done(false)
    }

    isSwitch = file.path !== currentFile.path
    currentFile = file
    localStorage.setItem('recent:' + allFiles.root, file.path)

    scrollToFit()
    $('#files li').removeClass('active')
    $('#files li[path="' + file.path + '"]').addClass('active')
    if (file.path !== decodeURIComponent(location.pathname)) {
        history.pushState(null, '', file.path)
    }

    $.post(apiEndpoint('file'), {
        path: file.path
    }, function (html) {
        $('#content').html(html)
        $('#table-of-contents > ul').appendTo($('#outline').empty())
        $('#table-of-contents').remove()

        isSwitch && $('#content').animate({scrollTop: 0}, 200)
        isSwitch && $('.heading[id="' + decodeURIComponent(location.hash.substr(1)) + '"] .heading-anchor').click()
        renderMathAsync()

        done && done(file)
    })
}

function openRecent(done) {
    var path
    if (/\.md$/.test(location.pathname)) {
        path = decodeURIComponent(location.pathname)
    } else {
        path = localStorage.getItem('recent:' + allFiles.root)
    }

    open(path, done)
}

function openReadme(done) {
    if (!allFiles.list) {
        return done(false)
    }

    var finds = []
    for (var i = 0; i < allFiles.list.length; i++) {
        if (allFiles.list[i].name.toLowerCase() === 'readme.md') {
            finds.push(allFiles.list[i].path)
        }
    }

    if (finds.length < 1) {
        return done(false)
    }

    finds.sort(function (a, b) {
        return a.length > b.length ? 1 : -1
    })

    open(finds.shift(), done)
}

function openFirst(done) {
    if (allFiles.list && allFiles.list.length > 0) {
        return open(allFiles.list[0].path, done)
    }

    return done(false)
}

function atBottom() {
    var contentElem = $('#content').get(0)
    return Math.abs(contentElem.scrollTop - (contentElem.scrollHeight - contentElem.offsetHeight)) < 3
}

function scrollToFit() {
    var filesElem = $('#files')
    var fileElem = filesElem.find('li[path="' + currentFile.path + '"]')
    var scrollTop = fileElem.offset().top - filesElem.offset().top + filesElem.scrollTop()

    if (scrollTop > filesElem.scrollTop() + filesElem.height()) {
        filesElem.animate({scrollTop: scrollTop}, 200)
    }
}

function renderMath(element) {
    cancelToRespond(element)

    var $e = $(element)
    var text = element.innerText
    var displayMode = element.classList.contains('display')

    if (mathElements[text]) {
        return $e.replaceWith(mathElements[text].clone())
    }

    if (displayMode) {
        var math = text.substr(2, text.length - 5)
    } else {
        var math = text.substr(2, text.length - 4)
    }

    $e.addClass('rendered')
    katex.render(math, element, {
        throwOnError: false,
        displayMode: displayMode
    })

    mathElements[text] = $e.clone()
}

function renderMathAsync() {
    for (var i = 0, elems = $('#content .math'); i < elems.length; i++) {
        respondToVisible(elems[i], renderMath)
    }
}

function apiEndpoint(url) {
    if (location.port === '3000') {
        return `/${url}`
    }

    return `http://127.0.0.1:3000/${url}`
}

$.get(apiEndpoint('files'), function (files) {
    try {
        allFiles = JSON.parse(files)
    } catch (e) {
        allFiles = {}
    }

    for (var i = 0; i < allFiles.list.length; i++) {
        var file = $(fileTemplate)
        file.text(allFiles.list[i].name)
        file.attr('path', allFiles.list[i].path)
        file.attr('title', allFiles.list[i].path)

        $('#files').append(file)
    }

    (function openQueue(queue) {
        var fn = queue.shift()
        fn && fn(function (flag) {
            flag || openQueue(queue)
        })
    })([openRecent, openReadme, openFirst])
})

$('#switch').click(function () {
    var asideEle = $('aside')
    if (asideEle.width() >= 16) {
        asideEle.removeClass('unfold').addClass('fold')
    } else {
        asideEle.removeClass('fold').addClass('unfold')
    }
})

$('#files').on('click', 'li', function () {
    open($(this).attr('path'))
})

$('#outline').click(function (e) {
    if (this === e.target) {
        $(this).toggleClass('active')
    }
})

$('#content').on('click', '.heading-anchor', function () {
    var contentElem = $('#content')
    contentElem.animate({scrollTop: contentElem.scrollTop() + $(this).offset().top}, 200)

    var hash = '#' + decodeURIComponent($(this).parent().attr('id'))
    if (location.hash !== hash) {
        location.hash = hash
    }

    return false
})

$('#content').scroll(function () {
    var timer
    return function () {
        clearTimeout(timer)
        timer = setTimeout(function () {
            var headingElems = $('#content .heading')
            if (atBottom()) {
                var id = headingElems.last().attr('id')
                return id && history.pushState(null, '', currentFile.path + '#' + id)
            }

            for (var i = 0, lastElem = headingElems.first(); i < headingElems.length; i++) {
                if (headingElems.eq(i).position().top > 0) {
                    history.pushState(null, '', currentFile.path + '#' + lastElem.attr('id'))
                    break
                }

                lastElem = headingElems.eq(i)
            }
        }, 300)
    }
}())

window.addEventListener('popstate', function () {
    if (currentFile.path !== decodeURIComponent(location.pathname)) {
        openRecent()
    }
})

setTimeout(function watcher() {
    if (!currentFile.path) {
        return setTimeout(watcher, 500)
    }

    $.post(apiEndpoint('stat'), {
        path: currentFile.path
    }, function (stat) {
        try {
            stat = JSON.parse(stat)
        } catch (e) {
            stat = {}
        }

        if (stat.updated_at <= currentFile.updated_at) {
            return setTimeout(watcher, 500)
        }

        open(currentFile.path, function () {
            currentFile.updated_at = stat.updated_at
            setTimeout(watcher, 500)
        })
    })
}, 500)
