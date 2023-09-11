import { useEffect, useState } from "react";
import { TokenId, AccountId } from "@hashgraph/sdk";
import moment from "moment";

function BorrowButton({ nft, borrowCar, flag, setFlag }) {
  const [isLoading, setIsLoading] = useState(false);
  return (
    <button
      className="primary-btn"
      onClick={async () => {
        setIsLoading(true);
        // Added conversion of tokenId to solidity address
        const tokenSolidityAddress = "0x" + TokenId.fromString(nft.token_id).toSolidityAddress();
        await borrowCar(tokenSolidityAddress, nft.serial_number);
        setIsLoading(false);
        setFlag(!flag);
      }}
      disabled={isLoading}
    >
      {isLoading ? "Borrowing..." : "Borrow"}
    </button>
  );
}

function Borrow({ borrowCar }) {
  const [data, setData] = useState();
  const [flag, setFlag] = useState(false);
  const [dataOwnership, setDataOwnership] = useState([]);

  const contractAddress = process.env.REACT_APP_SC_ADDRESS;
  const EvmAddress = contractAddress.replace("0x", "");

  useEffect(() => {
    // Fetching data from Hedera Mirror Node for car that can be borrowed
    const readData = async () => {
      try {
        await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${contractAddress}/nfts?order=asc`)
          .then((response) => response.json())
          .then((data) => {
            setData(data);
          });
      } catch (e) {
        console.log(e);
      }
    };

    const readOwnershipData = async () => {
      try {
        await fetch(`https://testnet.mirrornode.hedera.com/api/v1/accounts/${EvmAddress}`)
          .then((response) => response.json())
          .then(async (owner) => {
            for (let i = 1; i < data?.nfts?.length; i++) {
              await fetch(
                `https://testnet.mirrornode.hedera.com/api/v1/tokens/${AccountId.fromSolidityAddress(
                  process.env.REACT_APP_NFT_ADDRESS
                ).toString()}/nfts/${i}/transactions`
              )
                .then((response) => response.json())
                .then((list) => {
                  setDataOwnership(list.transactions.filter((nft) => nft.is_approval === true  && nft.sender_account_id !== owner.account));
                });
            }
          });
      } catch (e) {
        console.log(e);
      }
    }

    readData();
    readOwnershipData();
  }, [contractAddress, flag, EvmAddress, data?.nfts?.length]);

  return (
    <div className="App">
      <h1>Car Borrowing Page</h1>

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
                    <td className="title">Ownership History:</td>
                    <td className="desc">
                      {dataOwnership
                        .filter((ownership) => ownership.consensus_timestamp === nft.modified_timestamp)
                        .map((ownership) => ownership.sender_account_id)
                        .join(", ") || "No Data"}
                    </td>
                  </tr>
                  <tr>
                    <td className="title">Updated at:</td>
                    <td className="desc">{moment.unix(nft.modified_timestamp).format(`DD MMMM YYYY, h:mm:ss A`)}</td>
                  </tr>
                </tbody>
              </table>
              {/* Button for borrowing the car */}
              <div className="btn-container">
                <BorrowButton nft={nft} borrowCar={borrowCar} flag={flag} setFlag={setFlag} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Borrow;
