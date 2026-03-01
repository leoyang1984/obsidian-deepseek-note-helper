import { Plugin, WorkspaceLeaf } from 'obsidian';
import { DeepSeekView, DEEPSEEK_VIEW_TYPE } from './view';

interface DeepSeekSettings {
    apiKey: string;
    apiUrl: string;
    model: string;
}

const DEFAULT_SETTINGS: DeepSeekSettings = {
    apiKey: '',
    apiUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat'
}

export default class DeepSeekPlugin extends Plugin {
    settings: DeepSeekSettings = DEFAULT_SETTINGS;

    async onload() {
        await this.loadSettings();

        this.registerView(
            DEEPSEEK_VIEW_TYPE,
            (leaf) => new DeepSeekView(leaf, this)
        );

        this.addRibbonIcon('bot', 'Open DeepSeek helper', () => {
            this.activateView().catch(console.error);
        });

        this.addSettingTab(new DeepSeekSettingTab(this.app, this));
    }

    async activateView() {
        const { workspace } = this.app;

        let leaf: WorkspaceLeaf | null = null;
        const leaves = workspace.getLeavesOfType(DEEPSEEK_VIEW_TYPE);

        if (leaves.length > 0) {
            leaf = leaves[0];
        } else {
            leaf = workspace.getRightLeaf(false);
            if (leaf) {
                await leaf.setViewState({ type: DEEPSEEK_VIEW_TYPE, active: true });
            }
        }

        if (leaf) {
            workspace.revealLeaf(leaf);
        }
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}

import { App, PluginSettingTab, Setting } from 'obsidian';

class DeepSeekSettingTab extends PluginSettingTab {
    plugin: DeepSeekPlugin;

    constructor(app: App, plugin: DeepSeekPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl).setName('DeepSeek').setHeading();

        new Setting(containerEl)
            .setName('API key')
            .setDesc('Enter your DeepSeek API key.')
            .addText(text => text
                .setPlaceholder('sk-...')
                .setValue(this.plugin.settings.apiKey)
                .onChange((value) => {
                    this.plugin.settings.apiKey = value;
                    this.plugin.saveSettings().catch(console.error);
                }));

        new Setting(containerEl)
            .setName('API URL')
            .setDesc('Endpoint for DeepSeek API.')
            .addText(text => text
                .setValue(this.plugin.settings.apiUrl)
                .onChange((value) => {
                    this.plugin.settings.apiUrl = value;
                    this.plugin.saveSettings().catch(console.error);
                }));

        new Setting(containerEl)
            .setName('Model')
            .setDesc('Model to use.')
            .addText(text => text
                .setValue(this.plugin.settings.model)
                .onChange((value) => {
                    this.plugin.settings.model = value;
                    this.plugin.saveSettings().catch(console.error);
                }));
    }
}
