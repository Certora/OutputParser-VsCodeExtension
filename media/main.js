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
            case 'updateCurrentJob':
                {
                    //  console.log("updateCurrentJob-", message.current);
                     const current_state = vscode.getState();
                     let jobs = [];
                     if (current_state)
                        jobs = current_state.jobs;
                     vscode.setState({ jobs: jobs, currentJob: message.current });
                     break;
                }
            case 'getJob':
                {
                    getJob();
                    break;
                }
            case 'addJob':
                {
                    addJob(message.output_url, message.notify_msg);
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
            link.id = job.job_id;
			if (job.notify_msg){
                link.textContent = job.notify_msg;
            } else{
                link.textContent = job.job_id;
             }
            
            link.addEventListener('click', (e) => {
                e.preventDefault();
                // console.log("clicked from update");
                getJob(link);
            });
            div.appendChild(link);
        }

        const current_state = vscode.getState();
        let currentJob = "";

        if (current_state && current_state.currentJob){
            currentJob = current_state.currentJob;
            const current_elem = document.getElementById(current_state.currentJob);
            if (current_elem){
                current_elem.classList.add('active');
                // console.log("Added active class to", current_state.currentJob);
            }
        }

        // Update the saved state
        vscode.setState({ jobs: jobs, currentJob: currentJob });
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
    }

    /** 
     * @param {string} output_url 
     * @param {string} notify_msg
     * 
     * Appends the supplied job to current job list
     * Then triggers getJob()
    */
    function addJob(output_url, notify_msg){
        const id = get_id(output_url);
        const current_state = vscode.getState();
        let current_state_jobs = [];
        if (current_state && current_state.jobs){
            let output_urls = current_state.jobs.map(job => job.output_url);
            let ids = current_state.jobs.map(job => job.jobId);
            if (output_urls.includes(output_url) || ids.includes(id)){
                console.log("Already included in the list");
                return;
            }
            current_state_jobs = current_state.jobs;
        }
        let new_job = {"output_url": output_url};
        if (id)
            new_job.job_id = id;
        if (notify_msg)
            new_job.notify_msg = notify_msg;
        else if(id)
            new_job.notify_msg = id;
        else
            new_job.notify_msg = "Unknown";
        // add the new job to the beginning of an array
        // and returns the new length
        if (current_state_jobs.unshift(new_job) > 10){
            // pop the last element
            current_state_jobs.pop();
        }
        updateRecentJobs(current_state_jobs);
        let new_job_link;
        if (id)
            new_job_link = document.getElementById(id);
        else
            new_job_link = document.querySelectorAll('.clicks').forEach((el) => {
                const href = el.getAttribute('data-href');
                if ( href && href == output_url)
                    return href;
            });
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


