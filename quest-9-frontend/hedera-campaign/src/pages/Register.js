import { useEffect, useState } from "react";

function Register({register}) {
    const [isLoading, setIsLoading] = useState(false);

    const isRegister = async () => {
        
    };

    return (
        <div className="App">
            <h1>Register Account</h1>

            <div className="card2">
                <div className="item">
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setIsLoading(true);
                            await register(document.getElementById("firstName").value, document.getElementById("lastName").value) ;
                            setIsLoading(false);
                        }}
                        className="box"
                    >
                        <h2>First Name:</h2>
                        <input type="text" id="firstName" placeholder="First Name" required />
                        <h2>Last Name:</h2>
                        <input type="text" id="lastName" placeholder="Last Name" required />
                        <div style={{ width: "100%" }}>
                        {/* Submit button to create a new car NFT */}
                        <button type="submit" className="primary-btn" disabled={isLoading}>
                            {isLoading ? "Submitting..." : "Submit"}
                        </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Register