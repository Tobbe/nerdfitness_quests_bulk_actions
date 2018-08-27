// ==UserScript==
// @name         Nerd Fitness Reset quests
// @namespace    https://github.com/tobbe
// @version      0.1
// @description  Adds a button to reset (mark as uncomplete) all quests
// @license      MIT
// @author       Tobbe
// @match        https://www.nerdfitness.com/level-up/my-quests/
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function resetQuests() {
        const url = 'https://www.nerdfitness.com/wp-admin/admin-ajax.php?action=alm_query_posts&query_type=standard&nonce=6bc113fe44&repeater=template_2&theme_repeater=null&cta=&comments=&post_type%5B%5D=nfq_quest&post_format=&category=&category__not_in=&tag=&tag__not_in=&taxonomy=nfq_quest_category&taxonomy_terms=adventurer%2Cassassin%2Cdruid%2Cmonk%2Cranger%2Crebel%2Cscout%2Cwarrior%2Cacademy%2Cfitness%2Cmindset%2Cnutrition%2Cyoga&taxonomy_operator=&taxonomy_relation=&meta_key=&meta_value=&meta_compare=&meta_relation=&meta_type=&author=&year=&month=&day=&post_status=&order=DESC&orderby=date&post__in=&post__not_in=&exclude=&search=&custom_args=&posts_per_page=10000&page=0&offset=0&preloaded=false&seo_start_page=1&paging=false&previous_post=false&previous_post_id=&previous_post_taxonomy=&lang=&slug=my-quests&canonical_url=https%3A%2F%2Fwww.nerdfitness.com%2Flevel-up%2Fmy-quests%2F';
        fetch(url).then(data => data.json()).then(res => {
            const quests = res.html.split('<?php');
            const promises = [];
            quests.forEach(quest => {
                const idIndex = quest.indexOf('data-id="') + 'data-id="'.length;
                const idEndIndex = quest.indexOf('"', idIndex + 1);
                const id = quest.slice(idIndex, idEndIndex);

                if (quest.indexOf('q-incomplete') > 0) {
                    return; // Don't toggle already incomplete quests
                }

                const fetchConfig = {
                    body: new URLSearchParams("action=nfq_update_user_meta&security=&req=complete_quest&pid=" + id),
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    credentials: "same-origin",
                };

                if (id || id === 0) {
                    promises.push(fetch("https://www.nerdfitness.com/wp-admin/admin-ajax.php", fetchConfig));    
                }
              
                Promise.all(promises)
                    .then(() => window.location.reload())
                    .catch(error => console.error('error:', error));
            });
        });
    }

    function confirmResetQuests() {
        if (window.confirm("Do you really want to reset all quests?")) {
            resetQuests();
        }
    }

    const infoDiv = document.querySelector('.qh-showhide .in');
    const resetBtn = document.createElement('a');
    resetBtn.classList.add('subbtn');
    resetBtn.appendChild(document.createTextNode('Reset all quests'));
    resetBtn.onclick = confirmResetQuests;
    infoDiv.appendChild(resetBtn);
})();