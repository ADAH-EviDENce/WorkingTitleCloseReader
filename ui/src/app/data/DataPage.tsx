import React from "react";
import Page from "../common/Page";
import InfoBox from "../common/InfoBox";
import {AppContext} from "../AppContext";
import * as FileSaver from "file-saver";
import Resources from "../Resources";
import ConfirmModal from "../common/ConfirmModal";

export default class DataPage extends React.Component<any, any> {

    constructor(props: any, context: any) {
        super(props, context);
        this.state = {
            purging: false
        };
    }

    private saveFile = () => {
        const exportFilename = 'export.csv';
        Resources.getExport().then((data) => {
            const csv = new Blob([data], {type: "text/csv;charset=utf-8"});
            FileSaver.saveAs(csv, exportFilename);
        }).catch(() => {
            this.setState({error: 'Csv-bestand kon niet opgehaald worden.'});
        });
    };

    private purgeDatabase = () => {
        Resources.purgeDatabase(this.context.user).then(() => {
            this.setState({purging: false, info: 'Database is geleegd.'});
        }).catch(() => {
            this.setState({purging: false, error: 'Database kon niet geleegd worden.'});
        });
    };

    private confirmPurge = () => {
        this.setState({purging: true});
    };

    render() {
        return (
            <Page>
                <h2>Data</h2>
                <InfoBox msg={this.state.error} type="warning" onClose={() => this.setState({error: null})} />
                <InfoBox msg={this.state.info} type="info" onClose={() => this.setState({info: null})} />
                <ul className="list-group d-flex" role="group">
                    <li className="list-group-item list-group-item-action">
                        Exporteer als csv
                        <button
                            onClick={this.saveFile}
                            className="float-right btn btn-info btn-sm"
                        >
                            <i className='fa fa-download'/>
                            &nbsp;
                            Download
                        </button>
                    </li>
                    <li className="list-group-item list-group-item-action">
                        Leeg database
                        <button
                            onClick={this.confirmPurge}
                            className="float-right btn btn-danger btn-sm"
                        >
                            <i className='fa fa-trash'/>
                            &nbsp;
                            Leeg
                        </button>
                    </li>
                </ul>
                <ConfirmModal
                    onCancel={() => this.setState({purging: false})}
                    onContinue={this.purgeDatabase}
                    isOpen={this.state.purging}
                />
            </Page>
        );
    }
}

DataPage.contextType = AppContext;
