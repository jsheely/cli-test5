// 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
// ⚠️ THIS FILE IS AUTO-GENERATED WHEN packages/dapplib/interactions CHANGES
// DO **** NOT **** MODIFY CODE HERE AS IT WILL BE OVER-WRITTEN
// 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨

const fcl = require("@onflow/fcl");

module.exports = class DappTransactions {

	static kibble_mint_tokens() {
		return fcl.transaction`
				import FungibleToken from 0xee82856bf20e2aa6
				import Kibble from 0x01cf0e2f2f715450
				
				transaction(recipient: Address, amount: UFix64) {
				    let tokenAdmin: &Kibble.Administrator
				    let tokenReceiver: &{FungibleToken.Receiver}
				
				    prepare(signer: AuthAccount) {
				        self.tokenAdmin = signer
				        .borrow<&Kibble.Administrator>(from: Kibble.AdminStoragePath)
				        ?? panic("Signer is not the token admin")
				
				        self.tokenReceiver = getAccount(recipient)
				        .getCapability(Kibble.ReceiverPublicPath)!
				        .borrow<&{FungibleToken.Receiver}>()
				        ?? panic("Unable to borrow receiver reference")
				    }
				
				    execute {
				        let minter <- self.tokenAdmin.createNewMinter(allowedAmount: amount)
				        let mintedVault <- minter.mintTokens(amount: amount)
				
				        self.tokenReceiver.deposit(from: <-mintedVault)
				
				        destroy minter
				    }
				}
		`;
	}

	static kibble_setup_account() {
		return fcl.transaction`
				import FungibleToken from 0xee82856bf20e2aa6
				import Kibble from 0x01cf0e2f2f715450
				
				// This transaction is a template for a transaction
				// to add a Vault resource to their account
				// so that they can use the Kibble
				
				transaction {
				
				    prepare(signer: AuthAccount) {
				
				        if signer.borrow<&Kibble.Vault>(from: Kibble.VaultStoragePath) == nil {
				            // Create a new Kibble Vault and put it in storage
				            signer.save(<-Kibble.createEmptyVault(), to: Kibble.VaultStoragePath)
				
				            // Create a public capability to the Vault that only exposes
				            // the deposit function through the Receiver interface
				            signer.link<&Kibble.Vault{FungibleToken.Receiver}>(
				                Kibble.ReceiverPublicPath,
				                target: Kibble.VaultStoragePath
				            )
				
				            // Create a public capability to the Vault that only exposes
				            // the balance field through the Balance interface
				            signer.link<&Kibble.Vault{FungibleToken.Balance}>(
				                Kibble.BalancePublicPath,
				                target: Kibble.VaultStoragePath
				            )
				        }
				    }
				}
				
		`;
	}

	static kibble_transfer_tokens() {
		return fcl.transaction`
				import FungibleToken from 0xee82856bf20e2aa6
				import Kibble from 0x01cf0e2f2f715450
				
				// This transaction is a template for a transaction that
				// could be used by anyone to send tokens to another account
				// that has been set up to receive tokens.
				//
				// The withdraw amount and the account from getAccount
				// would be the parameters to the transaction
				
				transaction(amount: UFix64, to: Address) {
				
				    // The Vault resource that holds the tokens that are being transferred
				    let sentVault: @FungibleToken.Vault
				
				    prepare(signer: AuthAccount) {
				
				        // Get a reference to the signer's stored vault
				        let vaultRef = signer.borrow<&Kibble.Vault>(from: Kibble.VaultStoragePath)
							?? panic("Could not borrow reference to the owner's Vault!")
				
				        // Withdraw tokens from the signer's stored vault
				        self.sentVault <- vaultRef.withdraw(amount: amount)
				    }
				
				    execute {
				
				        // Get the recipient's public account object
				        let recipient = getAccount(to)
				
				        // Get a reference to the recipient's Receiver
				        let receiverRef = recipient.getCapability(Kibble.ReceiverPublicPath)!.borrow<&{FungibleToken.Receiver}>()
							?? panic("Could not borrow receiver reference to the recipient's Vault")
				
				        // Deposit the withdrawn tokens in the recipient's receiver
				        receiverRef.deposit(from: <-self.sentVault)
				    }
				}
		`;
	}

	static kittyitemsmarket_buy_market_item() {
		return fcl.transaction`
				import Kibble from 0x01cf0e2f2f715450
				import KittyItems from 0x01cf0e2f2f715450
				import FungibleToken from 0xee82856bf20e2aa6
				import NonFungibleToken from 0x01cf0e2f2f715450
				import KittyItemsMarket from 0x01cf0e2f2f715450
				
				transaction(itemID: UInt64, marketCollectionAddress: Address) {
				    let paymentVault: @FungibleToken.Vault
				    let kittyItemsCollection: &KittyItems.Collection{NonFungibleToken.Receiver}
				    let marketCollection: &KittyItemsMarket.Collection{KittyItemsMarket.CollectionPublic}
				
				    prepare(signer: AuthAccount) {
				        self.marketCollection = getAccount(marketCollectionAddress)
				            .getCapability<&KittyItemsMarket.Collection{KittyItemsMarket.CollectionPublic}>(
				                KittyItemsMarket.CollectionPublicPath
				            )!
				            .borrow()
				            ?? panic("Could not borrow market collection from market address")
				
				        let saleItem = self.marketCollection.borrowSaleItem(itemID: itemID)
				                    ?? panic("No item with that ID")
				        let price = saleItem.price
				
				        let mainKibbleVault = signer.borrow<&Kibble.Vault>(from: Kibble.VaultStoragePath)
				            ?? panic("Cannot borrow Kibble vault from acct storage")
				        self.paymentVault <- mainKibbleVault.withdraw(amount: price)
				
				        self.kittyItemsCollection = signer.borrow<&KittyItems.Collection{NonFungibleToken.Receiver}>(
				            from: KittyItems.CollectionStoragePath
				        ) ?? panic("Cannot borrow KittyItems collection receiver from acct")
				    }
				
				    execute {
				        self.marketCollection.purchase(
				            itemID: itemID,
				            buyerCollection: self.kittyItemsCollection,
				            buyerPayment: <- self.paymentVault
				        )
				    }
				}
		`;
	}

	static kittyitemsmarket_remove_market_item() {
		return fcl.transaction`
				import KittyItemsMarket from 0x01cf0e2f2f715450
				
				transaction(itemID: UInt64) {
				    let marketCollection: &KittyItemsMarket.Collection
				
				    prepare(signer: AuthAccount) {
				        self.marketCollection = signer.borrow<&KittyItemsMarket.Collection>(from: KittyItemsMarket.CollectionStoragePath)
				            ?? panic("Missing or mis-typed KittyItemsMarket Collection")
				    }
				
				    execute {
				        let offer <-self.marketCollection.remove(itemID: itemID)
				        destroy offer
				    }
				}
				
		`;
	}

	static kittyitemsmarket_sell_market_item() {
		return fcl.transaction`
				import Kibble from 0x01cf0e2f2f715450
				import KittyItems from 0x01cf0e2f2f715450
				import FungibleToken from 0xee82856bf20e2aa6
				import NonFungibleToken from 0x01cf0e2f2f715450
				import KittyItemsMarket from 0x01cf0e2f2f715450
				
				transaction(itemID: UInt64, price: UFix64) {
				    let kibbleVault: Capability<&Kibble.Vault{FungibleToken.Receiver}>
				    let kittyItemsCollection: Capability<&KittyItems.Collection{NonFungibleToken.Provider, KittyItems.KittyItemsCollectionPublic}>
				    let marketCollection: &KittyItemsMarket.Collection
				
				    prepare(signer: AuthAccount) {
				        // we need a provider capability, but one is not provided by default so we create one.
				        let KittyItemsCollectionProviderPrivatePath = /private/kittyItemsCollectionProvider
				
				        self.kibbleVault = signer.getCapability<&Kibble.Vault{FungibleToken.Receiver}>(Kibble.ReceiverPublicPath)!
				        assert(self.kibbleVault.borrow() != nil, message: "Missing or mis-typed Kibble receiver")
				
				        if !signer.getCapability<&KittyItems.Collection{NonFungibleToken.Provider, KittyItems.KittyItemsCollectionPublic}>(KittyItemsCollectionProviderPrivatePath)!.check() {
				            signer.link<&KittyItems.Collection{NonFungibleToken.Provider, KittyItems.KittyItemsCollectionPublic}>(KittyItemsCollectionProviderPrivatePath, target: KittyItems.CollectionStoragePath)
				        }
				
				        self.kittyItemsCollection = signer.getCapability<&KittyItems.Collection{NonFungibleToken.Provider, KittyItems.KittyItemsCollectionPublic}>(KittyItemsCollectionProviderPrivatePath)!
				        assert(self.kittyItemsCollection.borrow() != nil, message: "Missing or mis-typed KittyItemsCollection provider")
				
				        self.marketCollection = signer.borrow<&KittyItemsMarket.Collection>(from: KittyItemsMarket.CollectionStoragePath)
				            ?? panic("Missing or mis-typed KittyItemsMarket Collection")
				    }
				
				    execute {
				        let offer <- KittyItemsMarket.createSaleOffer (
				            sellerItemProvider: self.kittyItemsCollection,
				            itemID: itemID,
				            typeID: self.kittyItemsCollection.borrow()!.borrowKittyItem(id: itemID)!.typeID,
				            sellerPaymentReceiver: self.kibbleVault,
				            price: price
				        )
				        self.marketCollection.insert(offer: <-offer)
				    }
				}
		`;
	}

	static kittyitemsmarket_setup_account() {
		return fcl.transaction`
				import KittyItemsMarket from 0x01cf0e2f2f715450
				
				// This transaction configures an account to hold SaleOffer items.
				
				transaction {
				    prepare(signer: AuthAccount) {
				
				        // if the account doesn't already have a collection
				        if signer.borrow<&KittyItemsMarket.Collection>(from: KittyItemsMarket.CollectionStoragePath) == nil {
				
				            // create a new empty collection
				            let collection <- KittyItemsMarket.createEmptyCollection() as! @KittyItemsMarket.Collection
				            
				            // save it to the account
				            signer.save(<-collection, to: KittyItemsMarket.CollectionStoragePath)
				
				            // create a public capability for the collection
				            signer.link<&KittyItemsMarket.Collection{KittyItemsMarket.CollectionPublic}>(KittyItemsMarket.CollectionPublicPath, target: KittyItemsMarket.CollectionStoragePath)
				        }
				    }
				}
		`;
	}

	static kittyitems_mint_kitty_item() {
		return fcl.transaction`
				import NonFungibleToken from 0x01cf0e2f2f715450
				import KittyItems from 0x01cf0e2f2f715450
				
				// This transction uses the NFTMinter resource to mint a new NFT.
				//
				// It must be run with the account that has the minter resource
				// stored at path /storage/NFTMinter.
				
				transaction(recipient: Address, typeID: UInt64) {
				    
				    // local variable for storing the minter reference
				    let minter: &KittyItems.NFTMinter
				
				    prepare(signer: AuthAccount) {
				
				        // borrow a reference to the NFTMinter resource in storage
				        self.minter = signer.borrow<&KittyItems.NFTMinter>(from: KittyItems.MinterStoragePath)
				            ?? panic("Could not borrow a reference to the NFT minter")
				    }
				
				    execute {
				        // get the public account object for the recipient
				        let recipient = getAccount(recipient)
				
				        // borrow the recipient's public NFT collection reference
				        let receiver = recipient
				            .getCapability(KittyItems.CollectionPublicPath)!
				            .borrow<&{NonFungibleToken.CollectionPublic}>()
				            ?? panic("Could not get receiver reference to the NFT Collection")
				
				        // mint the NFT and deposit it to the recipient's collection
				        self.minter.mintNFT(recipient: receiver, typeID: typeID)
				    }
				}
		`;
	}

	static kittyitems_setup_account() {
		return fcl.transaction`
				import NonFungibleToken from 0x01cf0e2f2f715450
				import KittyItems from 0x01cf0e2f2f715450
				
				// This transaction configures an account to hold Kitty Items.
				
				transaction {
				    prepare(signer: AuthAccount) {
				        // if the account doesn't already have a collection
				        if signer.borrow<&KittyItems.Collection>(from: KittyItems.CollectionStoragePath) == nil {
				
				            // create a new empty collection
				            let collection <- KittyItems.createEmptyCollection()
				            
				            // save it to the account
				            signer.save(<-collection, to: KittyItems.CollectionStoragePath)
				
				            // create a public capability for the collection
				            signer.link<&KittyItems.Collection{NonFungibleToken.CollectionPublic, KittyItems.KittyItemsCollectionPublic}>(KittyItems.CollectionPublicPath, target: KittyItems.CollectionStoragePath)
				        }
				    }
				}
		`;
	}

	static kittyitems_transfer_kitty_item() {
		return fcl.transaction`
				import NonFungibleToken from 0x01cf0e2f2f715450
				import KittyItems from 0x01cf0e2f2f715450
				
				// This transaction transfers a Kitty Item from one account to another.
				
				transaction(recipient: Address, withdrawID: UInt64) {
				    prepare(signer: AuthAccount) {
				        
				        // get the recipients public account object
				        let recipient = getAccount(recipient)
				
				        // borrow a reference to the signer's NFT collection
				        let collectionRef = signer.borrow<&KittyItems.Collection>(from: KittyItems.CollectionStoragePath)
				            ?? panic("Could not borrow a reference to the owner's collection")
				
				        // borrow a public reference to the receivers collection
				        let depositRef = recipient.getCapability(KittyItems.CollectionPublicPath)!.borrow<&{NonFungibleToken.CollectionPublic}>()!
				
				        // withdraw the NFT from the owner's collection
				        let nft <- collectionRef.withdraw(withdrawID: withdrawID)
				
				        // Deposit the NFT in the recipient's collection
				        depositRef.deposit(token: <-nft)
				    }
				}
		`;
	}

}
