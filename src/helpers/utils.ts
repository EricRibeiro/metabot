export function sleep(milliseconds: number): Promise<null> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function getGitHubComment(prOwner: string, documents: any): string {
  const commentsPerLabelCount = documents.length;
  const commentsPerLabelPerBot = {}

  documents.forEach((curr) => {
    commentsPerLabelPerBot[curr.label] = commentsPerLabelPerBot[curr.label]
      ? commentsPerLabelPerBot[curr.label]
      : {};

    commentsPerLabelPerBot[curr.label][curr.comment.user.login] = commentsPerLabelPerBot[curr.label][curr.comment.user.login]
      ? commentsPerLabelPerBot[curr.label][curr.comment.user.login]
      : [];

    commentsPerLabelPerBot[curr.label][curr.comment.user.login].push(curr.comment.body);
  });

  let body = `\
        Hi @${prOwner}
  
        You have ${commentsPerLabelCount} ${commentsPerLabelCount === 1 ? "comment" : "comments"}, made by bots installed on this repo, regarding this pull request. \
        Check them below:\n`;

  for (const [label, commentsPerBot] of (<any>Object).entries(commentsPerLabelPerBot)) {
    const amountOfComments = (<any>Object)
      .values(commentsPerBot)
      .reduce((acc, curr) => { return acc + curr.length }, 0);

    body += `\
            <details>
            <summary>There ${amountOfComments === 1 ? "is" : "are"} <b>${amountOfComments}</b> ${amountOfComments === 1 ? "comment" : "comments"} with the label <b>${label}</b></summary>
            <br /> \n\n`;

    for (const [bot, comments] of (<any>Object).entries(commentsPerBot)) {
      body += `\
        <ul>
        <li>
        <details>
        <summary>${comments.length} ${comments.length === 1 ? "comment" : "comments"} made by <i>${bot}</i></summary>
        <br />\n\n`;

      comments.forEach(comment => body += `${comment}\n\n`);

      body += `\
        </details>
        </li>
        </ul>\n\n`;
    }

    body += `</details>`;
  }

  // removing empty tab spaces to have a valid markdown.
  return body.replace(/  /g, "")
}