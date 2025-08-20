 // Function to format the duration into minutes
 export function formatMinutes(secondsString) {
        let totalSeconds = Number(secondsString); // Convert string to number
        let minutes = Math.floor(totalSeconds / 60);
        let seconds = totalSeconds % 60;

        // Ensure two-digit formatting
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };