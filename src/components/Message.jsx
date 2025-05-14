import Markdown from "react-markdown";

const Message = (props) => {
    return (
        <div
            className={props.role + "-message"}
            style={{
                width: "fit-content",
                maxWidth: "80%",
                display: "inline-block",
            }}>
            <Markdown>{props.content}</Markdown>
        </div>
    );
};

export default Message;
