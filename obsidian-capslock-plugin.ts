import { Plugin, Notice, PluginSettingTab, App, Setting } from 'obsidian';

interface CapsLockNotifierSettings {
	noticeTimeout: number;
	noticeColor: string;
	showIcon: boolean;
	playSound: boolean;
}

const DEFAULT_SETTINGS: CapsLockNotifierSettings = {
	noticeTimeout: 3000,
	noticeColor: '#ff5555',
	showIcon: true,
	playSound: false
}

export default class CapsLockNotifierPlugin extends Plugin {
	settings: CapsLockNotifierSettings;
	statusBarItem: HTMLElement;
	isCapsLockOn: boolean = false;
	
	async onload() {
		await this.loadSettings();
		
		// Adiciona o ícone na barra de status
		if (this.settings.showIcon) {
			this.statusBarItem = this.addStatusBarItem();
			this.statusBarItem.setText('');
			this.updateStatusBarIcon(false);
		}
		
		// Adiciona configurações
		this.addSettingTab(new CapsLockNotifierSettingTab(this.app, this));
		
		// Registra o evento de tecla para detectar o CAPS LOCK
		this.registerDomEvent(document, 'keydown', (evt: KeyboardEvent) => {
			if (evt.getModifierState && evt.getModifierState('CapsLock')) {
				// Caps Lock está ativado
				if (!this.isCapsLockOn) {
					this.notifyCapsLock(true);
					this.isCapsLockOn = true;
					this.updateStatusBarIcon(true);
				}
			} else {
				// Caps Lock está desativado
				if (this.isCapsLockOn) {
					this.isCapsLockOn = false;
					this.updateStatusBarIcon(false);
				}
			}
		});
		
		// Verifica o estado do CAPS LOCK quando o plugin carrega
		this.checkInitialCapsLockState();
		
		console.log('Plugin de Notificação de CAPS LOCK carregado');
	}
	
	// Verifica o estado inicial do CAPS LOCK
	checkInitialCapsLockState() {
		// Infelizmente, não há uma API direta para checar o estado do CAPS LOCK
		// Esta verificação será atualizada no primeiro evento de teclado
		// Alternativamente, podemos criar um elemento de input invisível e focar nele
		// para determinar o estado inicial
		
		const tempInput = document.createElement('input');
		tempInput.style.position = 'absolute';
		tempInput.style.opacity = '0';
		tempInput.style.height = '0';
		tempInput.style.width = '0';
		document.body.appendChild(tempInput);
		tempInput.focus();
		
		// Verifica o estado após focar
		const isCapsLockOn = tempInput.getModifierState && tempInput.getModifierState('CapsLock');
		this.isCapsLockOn = !!isCapsLockOn;
		this.updateStatusBarIcon(this.isCapsLockOn);
		
		// Remove o elemento temporário
		document.body.removeChild(tempInput);
	}
	
	// Notifica o usuário sobre o status do CAPS LOCK
	notifyCapsLock(isOn: boolean) {
		if (isOn) {
			const notice = new Notice('CAPS LOCK ATIVADO', this.settings.noticeTimeout);
			// Personaliza a cor da notificação
			const noticeEl = notice.noticeEl;
			noticeEl.style.backgroundColor = this.settings.noticeColor;
			
			// Reproduz um som se configurado
			if (this.settings.playSound) {
				const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 
				                        'lvT18AAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
				audio.volume = 0.3;
				audio.play().catch(e => console.log('Erro ao reproduzir som: ', e));
			}
		}
	}
	
	// Atualiza o ícone na barra de status
	updateStatusBarIcon(isOn: boolean) {
		if (!this.settings.showIcon || !this.statusBarItem) return;
		
		if (isOn) {
			this.statusBarItem.setText('🔠 CAPS');
			this.statusBarItem.style.color = this.settings.noticeColor;
		} else {
			this.statusBarItem.setText('🔡 caps');
			this.statusBarItem.style.color = '';
		}
	}
	
	onunload() {
		console.log('Plugin de Notificação de CAPS LOCK descarregado');
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	
	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CapsLockNotifierSettingTab extends PluginSettingTab {
	plugin: CapsLockNotifierPlugin;
	
	constructor(app: App, plugin: CapsLockNotifierPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	
	display(): void {
		const {containerEl} = this;
		
		containerEl.empty();
		
		containerEl.createEl('h2', {text: 'Configurações do Notificador de CAPS LOCK'});
		
		new Setting(containerEl)
			.setName('Tempo da notificação')
			.setDesc('Tempo em milissegundos que a notificação ficará visível')
			.addSlider(slider => slider
				.setLimits(1000, 10000, 500)
				.setValue(this.plugin.settings.noticeTimeout)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.noticeTimeout = value;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('Cor da notificação')
			.setDesc('Cor de fundo para a notificação de CAPS LOCK')
			.addColorPicker(color => color
				.setValue(this.plugin.settings.noticeColor)
				.onChange(async (value) => {
					this.plugin.settings.noticeColor = value;
					await this.plugin.saveSettings();
				}));
				
		new Setting(containerEl)
			.setName('Mostrar ícone')
			.setDesc('Exibir um ícone na barra de status')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showIcon)
				.onChange(async (value) => {
					this.plugin.settings.showIcon = value;
					await this.plugin.saveSettings();
					
					// Atualiza a exibição do ícone
					if (value) {
						if (!this.plugin.statusBarItem) {
							this.plugin.statusBarItem = this.plugin.addStatusBarItem();
						}
						this.plugin.updateStatusBarIcon(this.plugin.isCapsLockOn);
					} else if (this.plugin.statusBarItem) {
						this.plugin.statusBarItem.remove();
						this.plugin.statusBarItem = null;
					}
				}));
				
		new Setting(containerEl)
			.setName('Reproduzir som')
			.setDesc('Reproduzir um alerta sonoro quando o CAPS LOCK for ativado')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.playSound)
				.onChange(async (value) => {
					this.plugin.settings.playSound = value;
					await this.plugin.saveSettings();
				}));
	}
}