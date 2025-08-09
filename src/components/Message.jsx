import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./Message.module.css";

const Message = (props) => {
    return (
        <div
            className={props.role + "-message"}
            style={{
                width: "fit-content",
                maxWidth: "80%",
                display: "inline-block",
            }}
        >
            <div className={styles.markdownContent}>
                <Markdown remarkPlugins={[remarkGfm]}>{props.content}</Markdown>
            </div>
        </div>
    );
};

export default Message;
