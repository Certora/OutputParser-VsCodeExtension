//@ts-check

// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    // This state is persisted even after the webview content itself is destroyed when a webview becomes hidden
    const prevState = vscode.getState() || { currentJob: "", jobs: [] }; // Q: should we save the data object too ?
    let jobs = prevState.jobs;
    console.log(prevState);

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
            case 'updateCurrentJob':
                {
                     console.log("updateCurrentJob-", message.current);
                     vscode.setState({ jobs: prevState.jobs, currentJob: message.current });
                     break;
                }
            case 'getJob':
                {
                    getJob();
                    break;
                }
            case 'addJob':
                {
                    addJob(message.output_url, message.notifyMsg);
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
            if (job.output_url)
                link.dataset.href = job.output_url;
            else
                link.dataset.href = "";
            link.className = 'clicks list-group-item list-group-item-action';
            link.id = job.jobId;
			if (job.notifyMsg){
                link.textContent = job.notifyMsg;
            } else{
                link.textContent = job.jobId;
             }
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
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
        const param = { type: 'jobSelected', value: item.id, output_url: item.dataset.href, msg: item.textContent };
        // send data to extension
        vscode.postMessage(param);
        // update webview state
        /*let new_state = prevState;
        new_state.currentJob = item.id
        vscode.setState(new_state);*/
    }

    /** 
     * @param {string} output_url 
     * @param {string} notifyMsg
     * 
     * Appends the supplied job to current job list
     * Then triggers getJob()
    */
    function addJob(output_url, notifyMsg){
        if (prevState.jobs){
            let output_urls = prevState.jobs.map(job => job.output_url);
            if (output_urls.includes(output_url)){
                console.log("Already included in the list");
                return;
            }
        }
        let new_job = {"output_url": output_url};
        const id = get_id(output_url);
        if (id)
            new_job.jobId = id;
        if (notifyMsg)
            new_job.notifyMsg = notifyMsg;
        else if(id)
            new_job.notifyMsg = id;
        else
            new_job.notifyMsg = "Unknown";
        console.log("new job", new_job);
        prevState.jobs.push(new_job);
        updateRecentJobs(prevState.jobs);
        let new_job_link;
        if (id)
            new_job_link = document.getElementById(id);
        else
            new_job_link = document.querySelectorAll('.clicks').forEach((el) => {
                const href = el.getAttribute('data-href');
                if ( href && href == output_url)
                    return href;
            });
        console.log(new_job_link);
        if (!new_job_link){
            console.log("Couldn't locate the new element...")
        } else {
            getJob(new_job_link);
        }
    }

    /** 
     * @param {string} output_url
     * 
     * @returns {string} id
     * 
    */
    function get_id(output_url){
        const splitted = output_url.split("//");
        let _url;
        if (splitted.length > 1)  // url included the scheme
            _url = splitted[1];
        else
            _url = splitted[0];
        const url_parts = _url.split('/');
        /**
            0: "vaas-stg.certora.com"
            1: "output"
            2: "user_id"
            3: "job_id"
            4: "data.json?anonymousKey="
         */
        if (url_parts.length >= 4){
            console.log("id is ", url_parts[3]);
            return url_parts[3];
        }
        return "";
    }
}());


