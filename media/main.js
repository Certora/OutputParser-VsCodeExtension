//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    // This state is persisted even after the webview content itself is destroyed when a webview becomes hidden
    const prevState = vscode.getState() || { currentJob: "", jobs: [] }; // Q: should we save the data object too ?
    let jobs = prevState.jobs;

    updateRecentJobs(jobs);

    // user can add any job by its id
    document.querySelector('#add-job-button').addEventListener('click', () => {
        vscode.postMessage({ type: 'addJob'});;
    });

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.type) {
            case 'updateJobs':
                {
                    // console.log("from event listener");
                    updateRecentJobs(message.jobs);
                    break;
                }
            case 'getJob':
                {
                    getJob();
                    break;
                }
            case 'addJob':
                {
                    addJob(message.id, message.isDev);
                    break;
                }
        }
    });

    function updateRecentJobs(jobs){
        console.log("updateRecentJobs()");
        const div = document.querySelector('#links');
        div.textContent = '';

        for (const job of jobs) {
            const link = document.createElement('a');
            link.className = 'clicks list-group-item list-group-item-action';
            if (job.isDev)
                link.className += ' dev';
            link.id = job.jobId;
            link.textContent = job.jobId;
			if (job.notifyMsg)
                link.textContent += ` - ${job.notifyMsg}`;
            
            link.addEventListener('click', () => {
                console.log("clicked from update");
                getJob(link);
            });
            div.appendChild(link);
        }

        if (prevState.currentJob){
            const current_job = document.getElementById(prevState.currentJob);
            if (current_job)
                current_job.classList.add('active');
        }

        // Update the saved state
        vscode.setState({ jobs: jobs, currentJob: prevState.currentJob });
    }


    /**
     * Sends clicked job data to extension and updates webview state
     */
    function getJob(item){
        console.log("clicked " + item.id);
        // remove the active class
        document.querySelectorAll('.active').forEach((el) => {
            el.classList.remove('active');
        });
        // add it to the clicked element
        item.classList.add("active");
        const param = { type: 'jobSelected', value: item.id };
        if (item.classList.contains("dev"))
            param.dev = true;
        // send data to extension
        vscode.postMessage(param);
        // update webview state
        let new_state = prevState;
        new_state.currentJob = item.id
        vscode.setState(new_state);
    }

    /** 
     * @param {string} jobId 
     * @param {boolean} isDev
     * 
     * Appends the supplied job to current job list
     * Then triggers getJob()
    */
    function addJob(jobId, isDev){
        let new_job = {"jobId": jobId};
        if (isDev)
            new_job.isDev = isDev;
        prevState.jobs.push(new_job);
        updateRecentJobs(jobs);
        const new_job_link = document.getElementById(jobId);
        getJob(new_job_link);
    }
}());


