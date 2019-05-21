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
	private pageLoader: azdata.LoadingComponent;

	private readonly DialogTitle = localize('managePackages.dialogName', "Manage Packages");
	private readonly CancelButtonText = localize('managePackages.cancelButtonText', "Close");

	constructor(private jupyterInstallation: JupyterServerInstallation) {
	}

	/**
	 * Opens a dialog to configure python installation for notebooks.
	 * @param rejectOnCancel Specifies whether an error should be thrown after clicking Cancel.
	 * @returns A promise that is resolved when the python installation completes.
	 */
	public showDialog(): void {
		this.dialog = azdata.window.createModelViewDialog(this.DialogTitle);

		this.initializeContent();

		this.dialog.okButton.hidden = true;
		this.dialog.cancelButton.label = this.CancelButtonText;

		azdata.window.openDialog(this.dialog);
	}

	private initializeContent(): void {
		this.dialog.registerContent(async view => {
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

			this.pageLoader = view.modelBuilder.loadingComponent()
				.withItem(formModel)
				.withProperties({
					loading: true
				}).component();

			await view.initializeModel(this.pageLoader);

			await this.loadPageData();
		});
	}

	private async loadPageData(): Promise<void> {
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

		await this.pageLoader.updateProperties({ loading: false });
	}

	private getDataForPackages(packages: PythonPkgDetails[]): string[][] {
		return packages.map(pkg => [pkg.name, pkg.version]);
	}

	private showErrorMessage(message: string): void {
		this.dialog.message = {
			text: message,
			level: azdata.window.MessageLevel.Error
		};
	}
}