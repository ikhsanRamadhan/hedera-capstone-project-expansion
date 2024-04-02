# Hedera Bounty StackUp

[Hedera Casptone Project](https://hedera-bounty.netlify.app/)

In an effort to enhance the user experience and make the car rental application more functional, several advanced features have been added to this project. Here is a detailed explanation of each implemented feature:

## Ownership History
The "Ownership History" feature is a valuable addition that allows users to see who has previously rented a car. The way it works is quite simple: the application compares the consensus timestamp with the modified timestamp obtained from the Hedera Mirror Node. If both times match, the sender's wallet address (sender_account_id) is recorded as the previous owner's data. With this information, users can better understand the history of the car they are renting and identify previous owners.

## Registration with Username
The "Registration with Username" feature adds a personal touch to user accounts. Instead of displaying only wallet addresses, the application now allows users to register with a unique username. This makes the user experience friendlier and enables them to be easily identified within the application community.

## Virtual Wallet
The "Virtual Wallet" feature is an innovation that simplifies the payment process within the application. Users can easily deposit the desired amount of Hbars. The way it works is simple: users transfer Hbars to a smart contract, and the amount is stored in a data struct associated with the user's account. This gives users a virtual balance that can be used to pay for their car rental bills, providing incredible flexibility in financial management.

## Car Rental Fees
With the "Car Rental Fees" feature, users can now accurately calculate their rental costs. The duration of the car rental is recorded, and in the example mentioned (in minutes), the cost is calculated based on the per-minute rate, which is 1 HBAR. This ensures that users only pay for the time they use, making the payment process fair and transparent.

## Car Return Page
In addition to the above features, the car return page has been enhanced with additional useful information. Users can now view their "Wallet Balance" to monitor their finances. Additionally, the "Rental Duration" of the borrowed car, "Unpaid Bill," and two forms for "Deposit Balance" and "Pay Bill" have been added. This allows users to manage their finances better and easily pay their bills.

I am very grateful to StackUp for this bounty because it has allowed me to learn about web3 and blockchain, especially Hedera. I added the above features by first imagining the features I wanted to add and then starting to think about how those features would work and translating it into code.

I apologize for the lackluster explanation I provided, as I find it challenging to convey information to others. Your understanding is greatly appreciated.

Discord username: nashki.

X (Twitter) username: [ikhsan_dadan](https://twitter.com/Ikhsan_dadan "ikhsan_dadan")
