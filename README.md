# Non Linear Chatbot

While learning new concepts using large language models like ChatGPT, I often
found myself overwhelmed when a single response introduced multiple unfamiliar ideas.
Although follow-up questions can help clarify these concepts, they often lead to
even more new terms—creating a recursive loop of confusion.

Currently, ChatGPT conversations are largely linear. While you can shift directions
mid-conversation, the interface isn’t particularly user-friendly when it comes to
tracking branching discussions.

So—what if we treated each question-response pair as a node, allowing the conversation
to grow like a tree? In this model, users could ask multiple follow-up questions based
on the same response, and easily navigate the resulting conversation graph.

This approach addresses at least two key issues:

1. Users struggle to revisit earlier parts of a conversation after several follow-ups.
2. Long, linear conversations accumulate too much context, leading to unnecessary
   computational overhead and increased risk of losing relevant information.

---

I'll be building a demo of this concept very soon—right after I finish my final
exams. Stay tuned!
