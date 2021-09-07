import $ from 'jquery'
import Store from '@/store'
import '@/components/sidebar'
import '@/components/outline'

$('aside').addClass(localStorage.getItem('ui:sidebar') === 'inactive' ? 'fold' : '')
$('#outline').addClass(localStorage.getItem('ui:outline') === 'active' ? 'active' : '')

window.addEventListener('popstate', () => {
    if (Store.currentFile.path !== decodeURIComponent(location.pathname))
        return Store.openRecent()

    if (location.hash === '')
        Store.currentHeading = {}
    else
        $('.heading-anchor[href="' + decodeURIComponent(location.hash) + '"]').click()
})
