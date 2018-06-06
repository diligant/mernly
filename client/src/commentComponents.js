// Displays all components
import React, { Component } from 'react';
import 'whatwg-fetch';
import PropTypes from 'prop-types';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';
import './CommentBox.css';

// data.js
const DATA = [
    { _id: 1, author: 'Bryan', text: 'Wow this is neat', updatedAt: new Date(), createdAt: new Date() },
    { _id: 2, author: 'You', text: 'You\'re __right!__', updatedAt: new Date(), createdAt: new Date() },
];



class CommentBox extends Component {
    constructor() {
        super();
        this.state = {
            data: [],
            error: null,
            author: '',
            text: ''
        };
    }
    componentDidMount() {
        this.loadCommentsFromServer();
        if (!this.pollInterval) {
            this.pollInterval = setInterval(this.loadCommentsFromServer, 2000);
        }
    }

    componentWillUnmount() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = null;
    }

    loadCommentsFromServer = () => {
        // fetch returns a promise. If you are not familiar with promises, see
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
        fetch('/api/comments/')
            .then(data => data.json())
            .then((res) => {
                if (!res.success) this.setState({ error: res.error });
                else this.setState({ data: res.data });
            });
    }

    onChangeText = (e) => {
        const newState = { ...this.state };
        newState[e.target.name] = e.target.value;
        this.setState(newState);
    }

    submitComment = (e) => {
        e.preventDefault();
        const { author, comment } = this.state;
        if (!author || !comment) return;
        fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, comment }),
        }).then(res => res.json()).then((res) => {
            if (!res.success) this.setState({ error: res.error.message || res.error });
            else this.setState({ author: '', text: '', error: null });
        });
    }

    onUpdateComment = (id) => {
        const oldComment = this.state.data.find(c => c._id === id);
        if (!oldComment) return;
        this.setState({
            author: oldComment.author,
            text: oldComment.text,
            updateId: id
        });
    }

    onDeleteComment = (id) => {
        const i = this.state.data.findIndex(c => c._id === id);
        const data = [
            ...this.state.data.slice(0, i),
            ...this.state.data.slice(i + 1),
        ];
        this.setState({ data });
        fetch(`api/comments/${id}`, { method: 'DELETE' })
            .then(res => res.json()).then((res) => {
            if (!res.success) this.setState({ error: res.error });
        });
    }

    submitComment = (e) => {
        e.preventDefault();
        const { author, text, updateId } = this.state;
        if (!author || !text) return;
        if (updateId) {
            this.submitUpdatedComment();
        } else {
            this.submitNewComment();
        }
    }

    submitNewComment = () => {
        const { author, text } = this.state;
        const data = [
            ...this.state.data,
            {
                author,
                text,
                _id: Date.now().toString(),
                updatedAt: new Date(),
                createdAt: new Date()
            },
        ];
        this.setState({ data });
        fetch('/api/comments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, text }),
        }).then(res => res.json()).then((res) => {
            if (!res.success) this.setState({ error: res.error.message || res.error });
            else this.setState({ author: '', text: '', error: null });
        });
    }

    submitUpdatedComment = () => {
        const { author, text, updateId } = this.state;
        fetch(`/api/comments/${updateId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ author, text }),
        }).then(res => res.json()).then((res) => {
            if (!res.success) this.setState({ error: res.error.message || res.error });
            else this.setState({ author: '', text: '', updateId: null });
        });
    }
    render() {
        return (
            <div className="container">
                <div className="comments">
                    <h2>Comments:</h2>
                    <CommentList data={this.state.data}
                                 handleDeleteComment={this.onDeleteComment}
                                 handleUpdateComment={this.onUpdateComment} />
                </div>
                <div className="form">
                    <CommentForm  author={this.state.author}
                                  text={this.state.text}
                                  handleChangeText={this.onChangeText}
                                  submitComment={this.submitComment} />
                </div>
                {this.state.error && <p>{this.state.error}</p>}
            </div>
        );
    }

}




const CommentList = (props) => {
    const commentNodes = props.data.map(comment => (
        <Comment author={comment.author}
                 key={comment._id}
                 id={comment._id}
                 timestamp={comment.updatedAt}
                 handleUpdateComment={props.handleUpdateComment}
                 handleDeleteComment={props.handleDeleteComment}
        >
            { comment.text}
        </Comment>
    ));
    return (
        <div>
            { commentNodes }
        </div>
    );
};

CommentList.propTypes = {
        data: PropTypes.arrayOf(PropTypes.shape({
        author: PropTypes.string,
        id: PropTypes.string,
        text: PropTypes.string,
        updatedAt: PropTypes.string
    })),
    handleDeleteComment: PropTypes.func.isRequired,
    handleUpdateComment: PropTypes.func.isRequired
};

CommentList.defaultProps = {
    data: [],
};



const CommentForm = props => (
    <form onSubmit={props.submitComment}>
        <input
            type="text"
            name="author"
            placeholder="Your name…"
            value={props.author}
            onChange={props.handleChangeText}
        />
        <input
            type="text"
            name="text"
            placeholder="Say something..."
            value={props.text}
            onChange={props.handleChangeText}
        />
        <button type="submit">Submit</button>
    </form>
);

CommentForm.propTypes = {
    submitComment: PropTypes.func.isRequired,
    handleChangeText: PropTypes.func.isRequired,
    text: PropTypes.string,
    author: PropTypes.string,
};

CommentForm.defaultProps = {
    text: '',
    author: '',
};



const Comment = props => (
    <div className="singleComment">
        <img alt="user_image" className="userImage" src={`https://picsum.photos/70?random=${props.id}`} />
        <div className="textContent">
            <div className="singleCommentContent">
                <h3>{props.author}</h3>
                <ReactMarkdown source={props.children} />
            </div>
            <div className="singleCommentButtons">
                <span className="time">{moment(props.timestamp).fromNow()}</span>
                <a onClick={() => { props.handleUpdateComment(props.id); }}>update</a>
                <a onClick={() => { props.handleDeleteComment(props.id); }}>delete</a>
            </div>
        </div>
    </div>
);

Comment.propTypes = {
    author: PropTypes.string.isRequired,
    children: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    handleUpdateComment: PropTypes.func.isRequired,
    handleDeleteComment: PropTypes.func.isRequired,
    timestamp: PropTypes.string.isRequired
};




export default CommentBox;