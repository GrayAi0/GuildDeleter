/**
 * @name GuildDeleter
 * @authorId 474244820303609877
 * @source https://raw.githubusercontent.com/GrayAi0/GuildDeleter/master/GuildDeleter.plugin.js
 * @updateUrl https://raw.githubusercontent.com/GrayAi0/GuildDeleter/master/GuildDeleter.plugin.js
*/

const CONFIG = {
    "info": {
        "name": "GuildDeleter",
        "author": "Gray F",
        "version": "1.0.0",
        "description": "This plugin show for you the guilds (servers), you in and allows you to delete them with the click of a button"
    },
    "changeLog": {
    }
}

module.exports = (_ => {

    return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
        getName () {return config.info.name;}
		getAuthor () {return config.info.author;}
		getVersion () {return config.info.version;}
        getDescription () {return config.info.description;}
        start() {
            if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, {pluginQueue: []});
			if (!window.BDFDB_Global.downloadModal) {
				window.BDFDB_Global.downloadModal = true;
				BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click "Download Now" to install it.`, {
					confirmText: "Download Now",
					cancelText: "Cancel",
					onCancel: _ => {delete window.BDFDB_Global.downloadModal;},
					onConfirm: _ => {
						delete window.BDFDB_Global.downloadModal;
						require("request").get("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js", (e, r, b) => {
							if (!e && b && b.indexOf(`* @name BDFDB`) > -1) require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => {});
							else BdApi.alert("Error", "Could not download BDFDB library plugin, try again some time later.");
						});
					}
				});
			}
			if (!window.BDFDB_Global.pluginQueue.includes(config.info.name)) window.BDFDB_Global.pluginQueue.push(config.info.name);
        }
        
    } : ( ([Plugin, BDFDB]) => { return class GuildDeleter extends Plugin {

        createdElmantes = []
        settings = {
            token: ''
        }
        button = null;
    
        getName() {return CONFIG.info.name;}
        getDescription() {return CONFIG.info.description;}
        getVersion() {return CONFIG.info.version;}
        getAuthor() {return CONFIG.info.author;}
    
    
        onLoad() {
            this.patchedModules = {
                after: {
                    Guilds: "render"
                }
            };
        }
    
        onStart() {
            


            this.main();

            BdApi.injectCSS('servers-view', `
            .server-view {
                padding: 10px;
                border-radius: 20px;
                text-align:center;
                margin-top: 10px;
                width: auto;
                height: 64px;
                background-color: var(--background-secondary);
                transition: 400ms;
            }

            .server-view[data-selected='false']:hover {
                background-color: var(--background-secondary-alt);
            }

            .server-view[data-selected='true'] {
                background-color: var(--bd-blue);
            }

            .server-view[data-selected='true']:hover {
                background-color: var(--bd-blue-hover);
            }
    
            .server-title {
                float:left;
                margin-top: 20px;
                margin-left: 10px !important;
                color: var(--text-normal);
            }

            .server-title[isowner='true'] {
                color: #eaa660;
                margin-left: 4px;
            }

            .owner-icon {
                color: #faa61a;
                margin-top: 20px;
                margin-left: 5px;
                float: left;
            }

            .servers-counter-label {
                color: var(--text-muted);
                text-align: center;
                text-transform: uppercase;
                font-size: 10px;
                font-weight: 500;
                line-height: 1.3;
                width: 70px;
                word-wrap: normal;
                white-space: nowrap;
                transition: 250ms;
            }

            .servers-counter-label:hover {
                color: var(--text-normal);
            }

            .server-icon {
                width: 64px;
                height: 64px;
                border-radius: 50%;
                float:left;
                overflow: hidden;
                transition: 250ms;
            }

            .server-icon:hover {
                border-radius: 30%;
            }

            .empty-server-icon {
                width: 64px;
                height: 64px;
                display: flex;
                font-weight: 500;
                line-height: 1.2em;
                white-space: nowrap;
                color: var(--text-normal);
                justify-content: center;
                align-items: center;
                background-color: var(--background-primary);
            }

            .empty-server-icon:hover {
                background-color: var(--blurple);
            }

            `)
        }
    
        onStop() {
            BdApi.clearCSS('servers-view')
            clearInterval(this.interval)
            for(let elm of this.createdElmantes) {
                if(elm && elm.remove) {
                    elm.remove()
                }
            }
        }
        
        createServerIcon = (name='') => {
            let letters = ''
            name.split(' ').forEach(e => letters += e[0].toLocaleUpperCase())
            return BDFDB.ReactUtils.createElement('div', { 
                className: 'server-icon',
                children: [
                    BDFDB.ReactUtils.createElement('div', {
                        className: 'empty-server-icon',
                        children: `${letters}`
                    })
                ]
            })
        }

        buttonCliked() {
            
            let guilds = []
            let selectedGuilds = []
            
            

            for(let guild of BDFDB.GuildUtils.getAll()) 
                guilds.push(BDFDB.ReactUtils.createElement('div', {
                    'data-id': `${guild.id}`,
                    className: 'server-view',
                    'data-selected': 'false',
                    children: [
                        guild.icon ? BDFDB.ReactUtils.createElement('img', { src: `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.webp?size=64`, className: 'server-icon' }) : this.createServerIcon(guild.name),
                        BDFDB.ReactUtils.createElement('h1', {
                            className: 'server-title',
                            children: `${guild.name}`
                        }),
                        guild.ownerId == BDFDB.UserUtils.me.id ?
                        BDFDB.ReactUtils.createElement('svg', {
                            'aria-label': 'Server Owner',
                            className: 'owner-icon icon-1A2_vz da-ownerIcon da-icon',
                            'aria-hidden': 'false',
                            'width': '24',
                            'height': '24',
                            'viewBox': '0 0 16 16',
                            dangerouslySetInnerHTML: {
                                __html: '<path fill-rule="evenodd" clip-rule="evenodd" d="M13.6572 5.42868C13.8879 5.29002 14.1806 5.30402 14.3973 5.46468C14.6133 5.62602 14.7119 5.90068 14.6473 6.16202L13.3139 11.4954C13.2393 11.7927 12.9726 12.0007 12.6666 12.0007H3.33325C3.02725 12.0007 2.76058 11.792 2.68592 11.4954L1.35258 6.16202C1.28792 5.90068 1.38658 5.62602 1.60258 5.46468C1.81992 5.30468 2.11192 5.29068 2.34325 5.42868L5.13192 7.10202L7.44592 3.63068C7.46173 3.60697 7.48377 3.5913 7.50588 3.57559C7.5192 3.56612 7.53255 3.55663 7.54458 3.54535L6.90258 2.90268C6.77325 2.77335 6.77325 2.56068 6.90258 2.43135L7.76458 1.56935C7.89392 1.44002 8.10658 1.44002 8.23592 1.56935L9.09792 2.43135C9.22725 2.56068 9.22725 2.77335 9.09792 2.90268L8.45592 3.54535C8.46794 3.55686 8.48154 3.56651 8.49516 3.57618C8.51703 3.5917 8.53897 3.60727 8.55458 3.63068L10.8686 7.10202L13.6572 5.42868ZM2.66667 12.6673H13.3333V14.0007H2.66667V12.6673Z" fill="currentColor" aria-hidden="true"></path>'
                            }
                        }) : undefined
                    ],
                }))
            
            
            ZLibrary.Modals.showModal('Delete Guilds', guilds, {
                danger: true,
                confirmText: "Delete",
                onConfirm: () => {
                    for(let guild of selectedGuilds) {
                        BDFDB.LibraryModules.GuildUtils.deleteGuild(guild.id)
                    }
                }
            })
            for(let elm of document.getElementsByClassName('server-view')) {
                    elm.addEventListener('click', () => {
                        let guild = this.getGuildFromId(elm.getAttribute('data-id'))
                        if(elm.getAttribute('data-selected') == 'true') {
                            elm.setAttribute('data-selected', 'false')
                            let index = selectedGuilds.indexOf(guild)
                            if(index > -1) {
                                selectedGuilds.splice(index, 1)
                            }
                            
                        }else {
                            elm.setAttribute('data-selected', 'true')
                            selectedGuilds.push(guild)
                            
                        }
                })
            }
        }

        getGuildFromId(id) {
            for(let g of BDFDB.GuildUtils.getAll())
                if(g.id == id) 
                    return g
    
        } 

        guildsCount() {
            return BDFDB.GuildUtils.getAll().length
        }
    
        reanderButton() {
            
            let bar = document.getElementsByClassName(BDFDB.DiscordClassModules.GuildsWrapper.scroller)[0]
    
            let counters = document.createElement('div')
            counters.setAttribute('class', `${BDFDB.DiscordClassModules.GuildsItems.listItem} ${BDFDB.DiscordClassModules.GuildsItems.listItem}`)
            
            let button = document.createElement("div");
            button.setAttribute('class', `servers-counter-label ${BDFDB.DiscordClassModules.Menu.label}`)
            
            counters.appendChild(button)
            
            button.innerText = `SERVERS - ${this.guildsCount()}`
            let _this = this
            button.addEventListener('click', () => {
                const Globalthis = _this
                Globalthis.buttonCliked(Globalthis)
            })
            
            this.button = button
            bar.insertBefore(counters, bar.children[1]);
            this.createdElmantes.push(counters)
            this.createdElmantes.push(button)
        }
    
        processGuilds(e) {
            console.log(e)
            this.button.innerText = `SERVERS - ${this.guildsCount()}`
        }

        main() {
            console.log(BDFDB)
            let text = 'da-label'
            for(let _key in BDFDB.DiscordClassModules) {
                let _value = BDFDB.DiscordClassModules[_key]
                for(let key in _value) {
                    let value = _value[key]
                    
                    if(value.indexOf(text) > -1) {
                        console.log(`${_key}.${key} == ${text}`)
                    }

                }
            }

            this.reanderButton()
        }

    }})(window.BDFDB_Global.PluginUtils.buildPlugin(CONFIG))

})();