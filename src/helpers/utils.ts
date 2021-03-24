export function sleep(milliseconds: number): Promise<null> {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

export function buildGitHubComment(prOwner: string, documents: any, botsToWaitForComment: string[] = []): string {
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

  const botsThatHaventCommented = botsToWaitForComment.reduce((acc: string[], curr: string) => {
    if (!documents.some(doc => doc.comment.user.login.includes(curr))) acc.push(curr);
    return acc
  }, []);

  if (botsThatHaventCommented.length > 0) {
    body += "\n";

    let bots = botsThatHaventCommented
      .map(curr => `<b>${curr}</b>`)
      .join(", ");

    if (botsThatHaventCommented.length > 1) {
      bots = strReplaceLast(bots, ",", " and");
    }

    body += `⚠️ The ${botsThatHaventCommented.length > 1 ? "bots" : "bot"} ${bots} `;
    body += `did not comment anything yet. I'll update this comment as soon as they do.`;
  }

  // removing empty tab spaces to have a valid markdown.
  return body.replace(/  /g, "");
}

// replaceLast where pattern is a string
export function strReplaceLast(str, pattern, replacement) {
  const i = str.lastIndexOf(pattern);
  if (i < 0) return str;
  return replaceAtIndex(str, pattern, replacement, i);
}

// Replace pattern by replacement at index
function replaceAtIndex(str, pattern, replacement, i) {
  const lhs = str.substring(0, i);
  const rhs = str.substring(i + pattern.length, str.length);
  return lhs + replacement + rhs;
}