import { useEffect, useState } from "react";
import { TokenId, Hbar } from "@hashgraph/sdk";
import moment from "moment";
import { ethers } from "ethers";

function ReturnButton({ nft, returnCar, flag, setFlag }) {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <button
      className="return-btn"
      onClick={async () => {
        setIsLoading(true);
        // Added conversion of tokenId to solidity address
        const tokenSolidityAddress = "0x" + TokenId.fromString(nft.token_id).toSolidityAddress();
        await returnCar(tokenSolidityAddress, nft.serial_number);
        setIsLoading(false);
        setFlag(!flag);
      }}
      disabled={isLoading}
    >
      {isLoading ? "Returning..." : "Return"}
    </button>
  );
}

function Return({ returnCar, address, myContract }) {
  const [data, setData] = useState();
  const [flag, setFlag] = useState(false);
  const [myBalance, setMyBalance] = useState(0);
  const [myDuration, setMyDuration] = useState();
  const [myDue, setMyDue] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

    // Fetching data from Hedera Mirror Node for car that can be returned
    const readData = async () => {
      try {
        await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}/nfts?order=asc`)
          .then((response) => response.json())
          .then((data) => {
            setData(data);
          });
      } catch (e) {
        console.log(e);
      }
    };

    const getBalance = async () => {
      let balance;

      try {
        const currentBalance = await myContract.renterBalance(address);
        balance = currentBalance.toString();
  
        setMyBalance(balance / 100000000);
      } catch(e) {
        console.log(e);
      }
    };

    const getDuration = async () => {
      let status

      try {
        const activeStatus = await myContract.checkActive(address);
        status = activeStatus;
      } catch(e) {
        console.log(e);
      }

      if (status === false) {
        try {
          const currentDuration = await myContract.getTotalDuration(address);
          setMyDuration(currentDuration.toString());
        } catch(e) {
          console.log(e);
        }
      } else setMyDuration("0");
    }

    const getDue = async () => {
      let due;
      
      try {
        const currentDue = await myContract.renterDue(address);
        due = currentDue.toString();
  
        setMyDue(due / 100000000);
      } catch(e) {
        console.log(e);
      }
    }

  useEffect(() => {
    readData();
    getBalance();
    getDuration();
    getDue();
  }, [address, flag, myContract]);

  const depositBalance = async () => {
    const depo = await myContract.deposit(address, {
      value: ethers.utils.parseEther(document.getElementById("deposit").value.toString()),
      gasLimit: 2_000_000,
    });
    await depo.wait();
  }

  const payment = async () => {
    const depo = await myContract.makePayment(address, {
      value: ethers.utils.parseEther(document.getElementById("pay").value.toString()),
      gasLimit: 2_000_000,
    });
    await depo.wait();
  }

  return (
    <div className="App">
      <h1>Car Returning Page</h1>

      {data?.nfts?.map((nft, index) => (
        <div className="card" key={index}>
          <div className="box">
            <div>
              {/* Car Image */}
              <img
                src="https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=250&h=140&dpr=1"
                alt="car"
                style={{ borderRadius: "5px" }}
              />
            </div>

            <div className="item">
              <table>
                <tbody>
                  <tr>
                    <td className="title" style={{ fontWeight: "bold" }}>
                      Token ID:
                    </td>
                    <td className="desc" style={{ fontWeight: "bold" }}>
                      {nft.token_id}
                    </td>
                  </tr>
                  <tr>
                    <td className="title">Serial Number:</td>
                    <td className="desc">{nft.serial_number}</td>
                  </tr>
                  <tr>
                    <td className="title">Current Holder:</td>
                    <td className="desc">{nft.account_id}</td>
                  </tr>
                  <tr>
                    <td className="title">Borrowed at:</td>
                    <td className="desc">{moment.unix(nft.modified_timestamp).format(`DD MMMM YYYY, h:mm:ss A`)}</td>
                  </tr>
                </tbody>
              </table>
              {/* Button for returning the car */}
              <div className="btn-container">
                <ReturnButton nft={nft} returnCar={returnCar} flag={flag} setFlag={setFlag} />
              </div>
            </div>
          </div>
        </div>
      ))}

      <h2>Payment Card:</h2>
      <div className="card2">
        <div className="box">
          Account Balance:&nbsp;
          {myBalance} HBAR
        </div>
      </div>
      <div className="card2">
        <div className="box">
          Borrow Durations:&nbsp;
          {myDuration} Minutes
        </div>
      </div>
      <div className="card2">
        <div className="box">
          Your Due:&nbsp;
          {myDue} HBAR
        </div>
      </div>
      <div className="card2">
        <div className="box">
          Deposit Balance:&nbsp;
        </div>
        <form onSubmit={ async(e) => {
          e.preventDefault();
          setIsLoading(true);
          depositBalance();
          setIsLoading(false);
        }}
        className="box">
          <input type="number" id="deposit" min="1" placeholder="HBAR" required />
          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>

      <div className="card2">
        <div className="box">
          Pay Your Due:&nbsp;
        </div>
        <form onSubmit={ async(e) => {
          e.preventDefault();
          setIsLoading(true);
          payment();
          setIsLoading(false);
        }}
        className="box">
          <input type="number" id="pay" min="1" placeholder="HBAR" required />
          <button type="submit" className="primary-btn" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Return;
