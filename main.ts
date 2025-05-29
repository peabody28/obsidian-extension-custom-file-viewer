import { App, Plugin, PluginSettingTab, Setting, TFile, Notice, TextComponent, ButtonComponent } from "obsidian";
import { execFile } from "child_process";
import * as path from "path";

interface CustomFileViewerSettings {
  appMap: Record<string, string>;
  defaultApp: string;
  ignoredExtensions: string[];
}

const DEFAULT_SETTINGS: CustomFileViewerSettings = {
  appMap: {},
  defaultApp: "",
  ignoredExtensions: [
    "md", "canvas", "pdf",
    "png", "jpg", "jpeg", "gif", "bmp", "svg", "webp",
    "mp4", "mov", "avi", "mkv", "webm"
  ]
};

export default class CustomFileViewerPlugin extends Plugin {
  settings: CustomFileViewerSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new CustomFileViewerSettingTab(this.app, this));

    this.registerDomEvent(document, "click", async (evt: MouseEvent) => {
		const target = evt.target as HTMLElement;
		const fileItem = target.closest('.nav-file');
		const filePath = fileItem?.querySelector('.nav-file-title')?.getAttr("data-path");
		const extension = filePath ? path.extname(filePath)?.substring(1) : null;

		if (extension && !this.settings.ignoredExtensions.includes(extension)) 
		{
		  const appPath = this.settings.appMap[extension] || this.settings.defaultApp;
			if (!appPath) return;

			evt.preventDefault();
			evt.stopImmediatePropagation();

			const vaultPath = (this.app.vault.adapter as any).getBasePath?.() || (this.app.vault.adapter as any).basePath;
			const fullPath = path.join(vaultPath, filePath!);

			execFile(appPath, [fullPath], (err) => {
				if (err) {
				  new Notice(`Failed to open ${filePath}: ${err.message}`);
				}
			});
		}

    }, true);
  }

  onunload() {
    // Cleanup if necessary
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class CustomFileViewerSettingTab extends PluginSettingTab {
  plugin: CustomFileViewerPlugin;

  constructor(app: App, plugin: CustomFileViewerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Custom File Viewer Settings" });

    // Default app
    new Setting(containerEl)
      .setName("Default Application Path")
      .setDesc("Path to the default app for opening files (used if no mapping found).")
      .addText(text =>
        text
          .setPlaceholder("C:\\Program Files\\...\\App.exe")
          .setValue(this.plugin.settings.defaultApp)
          .onChange(async (value) => {
            this.plugin.settings.defaultApp = value;
            await this.plugin.saveSettings();
          }));

    // Extension to app mapping (list)
    containerEl.createEl("h3", { text: "Extension to Application Mapping" });
    const listContainer = containerEl.createDiv();

    const refreshList = () => {
      listContainer.empty();
      const map = this.plugin.settings.appMap;

      Object.entries(map).forEach(([ext, appPath]) => {
        const row = listContainer.createDiv({ cls: "setting-item" });
        row.style.display = "flex";
        row.style.gap = "10px";
        row.style.alignItems = "center";

        // Extension text input
        const extInput = new TextComponent(row);
        extInput.setPlaceholder("Extension (e.g. py)");
        extInput.setValue(ext);
        extInput.inputEl.style.width = "80px";

        // App path text input
        const appInput = new TextComponent(row);
        appInput.setPlaceholder("Path to app");
        appInput.setValue(appPath);
        appInput.inputEl.style.flexGrow = "1";

        // Remove button
        const removeBtn = new ButtonComponent(row);
        removeBtn.setButtonText("Remove");
        removeBtn.onClick(async () => {
          delete map[extInput.getValue().toLowerCase()];
          await this.plugin.saveSettings();
          refreshList();
        });

        // Обновление map при изменении
        extInput.onChange(async (newExt) => {
          const oldExt = ext;
          const value = appInput.getValue();
          if (oldExt !== newExt.toLowerCase()) {
            delete map[oldExt];
          }
          if (newExt) {
            map[newExt.toLowerCase()] = value;
            await this.plugin.saveSettings();
          }
        });

        appInput.onChange(async (newAppPath) => {
          const extKey = extInput.getValue().toLowerCase();
          if (extKey) {
            map[extKey] = newAppPath;
            await this.plugin.saveSettings();
          }
        });
      });

      // Добавить новую пару
      const addBtn = listContainer.createEl("button", { text: "Add Mapping" });
      addBtn.style.marginTop = "10px";
      addBtn.onclick = () => {
        map[""] = "";
        this.plugin.saveSettings().then(() => refreshList());
      };
    };

    refreshList();

    // Ignored extensions textarea
    containerEl.createEl("h3", { text: "Ignored Extensions" });
    new Setting(containerEl)
      .setDesc("Comma-separated list of extensions that Obsidian will handle itself.")
      .addTextArea(text => {
        text.setValue(this.plugin.settings.ignoredExtensions.join(", "));
        text.inputEl.style.width = "100%";
        text.inputEl.rows = 3;
        text.onChange(async (value) => {
          this.plugin.settings.ignoredExtensions = value
            .split(",")
            .map(e => e.trim().toLowerCase())
            .filter(e => e.length > 0);
          await this.plugin.saveSettings();
        });
      });
  }
}
