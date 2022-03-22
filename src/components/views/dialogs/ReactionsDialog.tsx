import React from 'react';
import { Relations } from 'matrix-js-sdk/src/models/relations';
import { Room } from 'matrix-js-sdk/src/matrix';

import { _t } from '../../../languageHandler';
import { IDialogProps } from "./IDialogProps";
import { replaceableComponent } from "../../../utils/replaceableComponent";
import BaseDialog from "./BaseDialog";
import AccessibleButton from '../elements/AccessibleButton';

interface IProps extends IDialogProps {
    room: Room;
    reactions: Relations;
}

interface IState {
    filteredEmoji: string|null;
    allAnnotations: any[];
}

@replaceableComponent("views.dialogs.ReactionsDialog")
export default class ReactionsDialog extends React.Component<IProps, IState> {
    constructor(props: IProps) {
        super(props);
    }

    state = {
        filteredEmoji: null,
        allAnnotations: [],
    };

    componentDidMount() {
        this.setState({ allAnnotations: this.getAllAnnotations() });
    }

    private sortAnnotations(arr1, arr2) {
        return arr2[1].size - arr1[1].size;
    }

    private getAllAnnotations() {
        const room = this.props.room;
        const reactions = this.props.reactions;
        const sortedAnnotations = reactions.getSortedAnnotationsByKey()
            .sort(this.sortAnnotations);
        const senders = [];
        for (const reaction of sortedAnnotations) {
            const emoji = reaction[0];
            const reactionEvents = Array.from(reaction[1]);
            const sortedSenderNames = reactionEvents
                .map(reactionEvent => {
                    const member = room.getMember(reactionEvent.getSender());
                    return member ? member.name : reactionEvent.getSender();
                })
                .sort((a, b) => a.localeCompare(b));
            sortedSenderNames.forEach((name) => senders.push([emoji, name]));
        }
        return senders;
    }

    private getFilteredAnnotations() {
        const filterEmoji = this.state.filteredEmoji;
        return this.state.allAnnotations
            .filter(ann => filterEmoji === null || ann[0] == filterEmoji);
    }

    private setFilterEmoji(emoji) {
        const matchingEmoji = this.state.allAnnotations
            .filter(([existingEmoji, _]) => emoji === existingEmoji);
        if (matchingEmoji.length == 0) {
            emoji = null;
        }
        this.setState({ filteredEmoji: emoji });
    }

    private emojiFilterButton(emoji, size) {
        return (<AccessibleButton
            className="mx_EmojiFilterButton"
            onClick={() => this.setFilterEmoji(emoji)}
        >
            { emoji } { size }
        </AccessibleButton>);
    }

    render() {
        const reactions = this.props.reactions.getSortedAnnotationsByKey()
            .map(([emoji, senders]): [string, number] => [emoji, senders.size]);
        const totalReactions = reactions.reduce((acc, [_, size]) => size + acc, 0);
        reactions.unshift([_t('All'), totalReactions]);

        const emojiList = reactions.map(([emoji, size]) =>
            (<li key={emoji}>{ this.emojiFilterButton(emoji, size) }</li>));
        const senderList = this.getFilteredAnnotations()
            .map(([emoji, sender]) => (<li key={emoji + sender}>{ emoji }&nbsp;{ sender }</li>));
        return (
            <BaseDialog
                className="mx_ReactionsDialog"
                onFinished={this.props.onFinished}
                title={_t('Reactions')}
                contentId='mx_ReactionsDialog'
            >
                <div className="mx_ReactionsWrapper">
                    <ul className="mx_EmojiList">
                        { emojiList }
                    </ul>
                    <ul className="mx_SenderList">
                        { senderList }
                    </ul>
                </div>
            </BaseDialog>
        );
    }
}