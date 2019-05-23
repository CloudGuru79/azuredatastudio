/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as nls from 'vscode-nls';
import * as azdata from 'azdata';

import JupyterServerInstallation, { PythonPkgDetails } from '../jupyter/jupyterServerInstallation';
import * as utils from '../common/utils';

const localize = nls.loadMessageBundle();

export class ManagePackagesDialog {
	private dialog: azdata.window.Dialog;

	private packageCountLabel: azdata.TextComponent;
	private packagesTable: azdata.TableComponent;
	private installedTabLoader: azdata.LoadingComponent;

	private installedTab: azdata.window.DialogTab;
	private addNewTab: azdata.window.DialogTab;

	private readonly DialogTitle = localize('managePackages.dialogName', "Manage Packages");
	private readonly CancelButtonText = localize('managePackages.cancelButtonText', "Close");
	private readonly InstalledTabTitle = localize('managePackages.installedTabTitle', "Installed");
	private readonly AddNewTabTitle = localize('managePackages.addNewTabTitle', "Add new");

	constructor(private jupyterInstallation: JupyterServerInstallation) {
	}

	/**
	 * Opens a dialog to configure python installation for notebooks.
	 * @param rejectOnCancel Specifies whether an error should be thrown after clicking Cancel.
	 * @returns A promise that is resolved when the python installation completes.
	 */
	public showDialog(): void {
		this.dialog = azdata.window.createModelViewDialog(this.DialogTitle);
		this.installedTab = azdata.window.createTab(this.InstalledTabTitle);
		this.addNewTab = azdata.window.createTab(this.AddNewTabTitle);

		this.initializeInstalledTab();
		this.initializeAddNewTab();

		this.dialog.okButton.hidden = true;
		this.dialog.cancelButton.label = this.CancelButtonText;

		this.dialog.content = [this.installedTab, this.addNewTab];

		azdata.window.openDialog(this.dialog);
	}

	private initializeInstalledTab(): void {
		this.installedTab.registerContent(async view => {
			this.packageCountLabel = view.modelBuilder.text().withProperties({
				value: ''
			}).component();

			this.packagesTable = view.modelBuilder.table()
				.withProperties({
					columns: [
						localize('managePackages.pkgNameColumn', "Name"),
						localize('managePackages.pkgVersionColumn', "Version")
					],
					data: [[]],
					height: '700px',
					width: '400px'
				}).component();

			let formModel = view.modelBuilder.formContainer()
				.withFormItems([{
					component: this.packageCountLabel,
					title: ''
				}, {
					component: this.packagesTable,
					title: ''
				}]).component();

			this.installedTabLoader = view.modelBuilder.loadingComponent()
				.withItem(formModel)
				.withProperties({
					loading: true
				}).component();

			await view.initializeModel(this.installedTabLoader);

			await this.loadInstalledTabData();
		});
	}

	private async loadInstalledTabData(): Promise<void> {
		try {
			let pythonPackages = await this.jupyterInstallation.getInstalledPipPackages();
			let packagesLocation = await this.jupyterInstallation.getPythonPackagesPath();

			await this.packageCountLabel.updateProperties({
				value: localize('managePackages.packageCountLabel', "{0} packages found in '{1}'",
					pythonPackages.length,
					packagesLocation)
			});

			await this.packagesTable.updateProperties({
				data: this.getDataForPackages(pythonPackages)
			});
		} catch (err) {
			this.showErrorMessage(utils.getErrorMessage(err));
		}

		await this.installedTabLoader.updateProperties({ loading: false });
	}

	private getDataForPackages(packages: PythonPkgDetails[]): string[][] {
		return packages.map(pkg => [pkg.name, pkg.version]);
	}

	private initializeAddNewTab(): void {
		this.addNewTab.registerContent(async view => {
			let formModel = view.modelBuilder.formContainer()
				.withFormItems([

				]).component();

			await view.initializeModel(formModel);

			await this.loadAddNewTabData();
		});
	}

	private async loadAddNewTabData(): Promise<void> {
	}

	private showErrorMessage(message: string): void {
		this.dialog.message = {
			text: message,
			level: azdata.window.MessageLevel.Error
		};
	}
}