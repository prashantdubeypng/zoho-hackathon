/**
 * Generate Cliq message card for CI run
 */
function buildCliqCard(run, actionUrl) {
    const statusColor = run.status === 'failure' ? '#e74c3c' :
        run.status === 'success' ? '#2ecc71' : '#95a5a6';

    const statusIcon = run.status === 'failure' ? '❌' :
        run.status === 'success' ? '✅' : 'ℹ️';

    return {
        text: `${statusIcon} CI Run ${run.status.toUpperCase()}`,
        card: {
            title: `${statusIcon} ${run.workflow} - ${run.status.toUpperCase()}`,
            theme: statusColor,
            thumbnail: "https://img.icons8.com/fluency/96/000000/code.png",
            sections: [
                {
                    id: 1,
                    elements: [
                        {
                            type: "text",
                            text: `**Repository:** ${run.repo}`
                        },
                        {
                            type: "text",
                            text: `**Branch:** ${run.branch}`
                        },
                        {
                            type: "text",
                            text: `**Commit:** \`${run.commit_sha?.substring(0, 7)}\``
                        },
                        {
                            type: "text",
                            text: `**Status:** ${run.status}`
                        }
                    ]
                },
                {
                    id: 2,
                    elements: [
                        {
                            type: "text",
                            text: `**Logs:**\n\`\`\`\n${run.logs?.substring(0, 300) || 'No logs available'}\n\`\`\``
                        }
                    ]
                }
            ],
            buttons: [
                {
                    label: "🔄 Re-run",
                    type: "+",
                    action: {
                        type: "invoke.function",
                        name: "ci-action-handler",
                        id: "rerun-action"
                    },
                    key: "rerun",
                    data: {
                        action: "rerun",
                        run_id: run.id,
                        repo: run.repo,
                        run_url: run.run_url
                    }
                },
                {
                    label: "👤 Assign",
                    type: "+",
                    action: {
                        type: "invoke.function",
                        name: "ci-action-handler",
                        id: "assign-action"
                    },
                    key: "assign",
                    data: {
                        action: "assign",
                        run_id: run.id
                    }
                },
                {
                    label: "🔗 View Run",
                    type: "open.url",
                    url: run.run_url
                }
            ]
        }
    };
}

module.exports = {
    buildCliqCard
};
